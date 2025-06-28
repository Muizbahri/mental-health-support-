const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fetch = require('node-fetch');

const token = process.env.TELEGRAM_BOT_TOKEN;

// Only start polling if this file is run directly (not imported)
let bot;
if (require.main === module) {
  bot = new TelegramBot(token, { polling: true });
  console.log('Telegram bot started (standalone)');
} else {
  bot = new TelegramBot(token, { polling: false });
  console.log('Telegram bot loaded as module (no polling)');
}

// In-memory store for user assessment states
const userStates = {};

// In-memory store for bot message IDs to be deleted
const userBotMessages = {};

// Helper to track bot message IDs
function trackMessage(chatId, message) {
    if (message && message.message_id) {
        if (!userBotMessages[chatId]) {
            userBotMessages[chatId] = [];
        }
        userBotMessages[chatId].push(message.message_id);
    }
}

// PHQ-9 Questions
const phq9Questions = [
    "Over the last 2 weeks, how often have you been bothered by:\n\n*1. Little interest or pleasure in doing things?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*2. Feeling down, depressed, or hopeless?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*3. Trouble falling or staying asleep, or sleeping too much?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*4. Feeling tired or having little energy?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*5. Poor appetite or overeating?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*6. Feeling bad about yourself—or that you are a failure or have let yourself or your family down?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*7. Trouble concentrating on things, such as reading the newspaper or watching television?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*8. Moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*9. Thoughts that you would be better off dead, or of hurting yourself in some way?*"
];

// GAD-7 Questions
const gad7Questions = [
    "Over the last 2 weeks, how often have you been bothered by:\n\n*1. Feeling nervous, anxious, or on edge?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*2. Not being able to stop or control worrying?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*3. Worrying too much about different things?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*4. Trouble relaxing?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*5. Being so restless that it is hard to sit still?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*6. Becoming easily annoyed or irritable?*",
    "Over the last 2 weeks, how often have you been bothered by:\n\n*7. Feeling afraid as if something awful might happen?*"
];

// PHQ-9 Answer Keyboard
const phq9AnswerKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "Not at all", callback_data: "phq9_answer_0" }],
            [{ text: "Several days", callback_data: "phq9_answer_1" }],
            [{ text: "More than half the days", callback_data: "phq9_answer_2" }],
            [{ text: "Nearly every day", callback_data: "phq9_answer_3" }]
        ]
    }
};

// GAD-7 Answer Keyboard
const gad7AnswerKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "Not at all", callback_data: "gad7_answer_0" }],
            [{ text: "Several days", callback_data: "gad7_answer_1" }],
            [{ text: "More than half the days", callback_data: "gad7_answer_2" }],
            [{ text: "Nearly every day", callback_data: "gad7_answer_3" }]
        ]
    }
};

// Main menu keyboard
const mainMenuKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "📋 Self-Assessment PHQ-9",
          callback_data: "phq9_assessment"
        }
      ],
      [
        {
          text: "📋 Self-Assessment GAD-7", 
          callback_data: "gad7_assessment"
        }
      ],
      [
        {
          text: "🏥 Find Hospital & Clinics",
          callback_data: "find_hospitals"
        }
      ],
      [
        {
          text: "👥 Find Community",
          callback_data: "find_community"
        }
      ],
      [
        {
          text: "🎯 Find Activity",
          callback_data: "find_activity"
        }
      ],
      [
        {
          text: "🚨 Contact Emergency",
          callback_data: "emergency_contact"
        }
      ]
    ]
  }
};

// Welcome message with descriptions
const welcomeMessage = `🤖 *Mental Health Support Bot*

Welcome! I'm here to help you with your mental health journey. Please select an option below:

📋 *Self-Assessment PHQ-9*
Take a quick depression screening (PHQ-9) to check your mental health status.

📋 *Self-Assessment GAD-7* 
Take a quick anxiety screening (GAD-7) to check your anxiety level.

🏥 *Find Hospital & Clinics*
Get a list and map of nearby hospitals and clinics for mental health support.

👥 *Find Community*
Connect with local mental health communities and support groups.

🎯 *Find Activity*
Discover mental health-related events, workshops, or activities around you.

🚨 *Contact Emergency*
Instantly access emergency contacts for urgent mental health support.`;

// --- Reusable Menu Function ---
async function sendMainMenu(chatId) {
    const menuText = "How can I help you? Please choose an option from the menu below.";
    try {
        const sentMsg = await bot.sendMessage(chatId, menuText, {
            ...mainMenuKeyboard
        });
        trackMessage(chatId, sentMsg);
    } catch (error) {
        console.error('Error sending main menu:', error);
    }
}

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const sentMsg = await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard
    });
    trackMessage(chatId, sentMsg);
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

// --- PHQ-9 Assessment Functions ---

// Function to send a PHQ-9 question or calculate the result
async function sendPHQ9Question(chatId, messageId) {
    const state = userStates[chatId];
    const questionIndex = state.currentQuestion;

    if (questionIndex < phq9Questions.length) {
        const questionText = phq9Questions[questionIndex];
        const options = {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            ...phq9AnswerKeyboard
        };
        try {
            await bot.editMessageText(questionText, options);
        } catch (error) {
            // If the message is the same, Telegram might throw an error.
            // In that case, we can ignore it or handle it as needed.
            if (!error.message.includes('message is not modified')) {
                console.error('Error sending PHQ-9 question:', error);
            }
        }
    } else {
        // All questions answered, calculate and show result
        await bot.editMessageText('Thank you for completing the assessment. Calculating your results...', {
            chat_id: chatId,
            message_id: messageId
        });
        await calculateAndShowPHQ9Result(chatId);
    }
}


// Function to calculate score and show the final result
async function calculateAndShowPHQ9Result(chatId) {
    const state = userStates[chatId];
    const score = state.score;

    let severity = "";
    let recommendation = "";

    if (score >= 0 && score <= 4) {
        severity = "Minimal Depression";
        recommendation = "Your score suggests you may have minimal or no symptoms of depression. Continue to monitor your mood. If you have any concerns, consider talking to a friend, family member, or a professional.";
    } else if (score >= 5 && score <= 9) {
        severity = "Mild Depression";
        recommendation = "Your score suggests you may be experiencing mild depression. It might be helpful to talk to a healthcare provider about how you're feeling. Lifestyle changes like exercise and mindfulness can also help.";
    } else if (score >= 10 && score <= 14) {
        severity = "Moderate Depression";
        recommendation = "Your score suggests moderate depression. It is highly recommended that you speak with a doctor or a mental health professional to discuss treatment options.";
    } else if (score >= 15 && score <= 19) {
        severity = "Moderately Severe Depression";
        recommendation = "Your score indicates moderately severe depression. It's important to seek professional help soon. A combination of therapy and/or medication is often effective.";
    } else { // 20-27
        severity = "Severe Depression";
        recommendation = "Your score suggests severe depression. Please contact a mental health professional or a doctor immediately. If you have thoughts of harming yourself, please use the 'Contact Emergency' option or call a crisis hotline right away.";
    }

    const resultMessage = `*PHQ-9 Result*

*Your Score:* ${score}
*Severity:* ${severity}

*Recommendation:*
${recommendation}

*Disclaimer: This is a screening tool and not a diagnosis. Please consult a qualified healthcare professional for an accurate diagnosis and treatment plan.*`;

    const resultMsg = await bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });
    trackMessage(chatId, resultMsg);

    // Clean up the state
    delete userStates[chatId];

    // Show the main menu again
    await sendMainMenu(chatId);
}

// Handle callback queries (button presses)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  // Answer callback query immediately to remove loading icon
  bot.answerCallbackQuery(callbackQuery.id);

  // Handle PHQ-9 answers
  if (data.startsWith('phq9_answer_')) {
      const state = userStates[chatId];
      if (state && state.type === 'phq9') {
          const answerScore = parseInt(data.split('_')[2], 10);
          state.score += answerScore;
          state.currentQuestion++;
          await sendPHQ9Question(chatId, messageId);
      }
      return; // Stop further processing
  }

  // Handle GAD-7 answers
  if (data.startsWith('gad7_answer_')) {
      const state = userStates[chatId];
      if (state && state.type === 'gad7') {
          const answerScore = parseInt(data.split('_')[2], 10);
          state.score += answerScore;
          state.currentQuestion++;
          await sendGAD7Question(chatId, messageId);
      }
      return; // Stop further processing
  }

  try {
    switch (data) {
      case 'phq9_assessment':
        await handlePHQ9Assessment(chatId);
        break;
      case 'start_phq9': // This case starts the assessment
        userStates[chatId] = { type: 'phq9', currentQuestion: 0, score: 0 };
        await sendPHQ9Question(chatId, messageId);
        break;
      case 'gad7_assessment':
        await handleGAD7Assessment(chatId);
        break;
      case 'start_gad7': // This case starts the GAD-7 assessment
        userStates[chatId] = { type: 'gad7', currentQuestion: 0, score: 0 };
        await sendGAD7Question(chatId, messageId);
        break;
      case 'find_hospitals':
        await handleFindHospitals(chatId);
        break;
      case 'share_location':
        await bot.sendMessage(chatId, "Please use the 'Attach' button (📎) in your Telegram app and select 'Location' to share your current location with me.");
        break;
      case 'find_community':
        await handleFindCommunity(chatId);
        break;
      case 'find_activity':
        await handleFindActivity(chatId);
        break;
      case 'emergency_contact':
        await handleEmergencyContact(chatId);
        break;
      case 'more_crisis_resources':
        await handleMoreCrisisResources(chatId);
        break;
      case 'local_emergency':
        await handleLocalEmergency(chatId);
        break;
      case 'online_crisis_support':
        await handleOnlineCrisisSupport(chatId);
        break;
      case 'back_to_menu':
        await bot.editMessageText('Returning to the main menu...', { chat_id: chatId, message_id: messageId });
        await sendMainMenu(chatId);
        break;
      default:
        const sentMsg = await bot.sendMessage(chatId, 'Invalid option selected.');
        trackMessage(chatId, sentMsg);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    const sentMsg = await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
    trackMessage(chatId, sentMsg);
  }
});

bot.on('location', async (msg) => {
  const chatId = msg.chat.id;
  const { latitude, longitude } = msg.location;

  const searchingMsg = await bot.sendMessage(chatId, 'Thanks! Searching for the nearest mental health professionals for you...');
  trackMessage(chatId, searchingMsg);

  try {
    const response = await fetch('http://194.164.148.171:5000/api/telegram/find-nearest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });

    const result = await response.json();

    if (result.success && result.data.length > 0) {
      let replyMessage = '📍 *Here are the 5 nearest professionals found:*';
      
      result.data.forEach(p => {
        replyMessage += `\n\n- - - - - - - - - - - - - - - - - - -`;
        replyMessage += `\n\n*${p.full_name}* (${p.type})`;
        replyMessage += `\n*Location:* ${p.location}`;
        replyMessage += `\n*Distance:* ${p.distance.toFixed(2)} km away`;
      });
      
      const replyMsg = await bot.sendMessage(chatId, replyMessage, { parse_mode: 'Markdown' });
      trackMessage(chatId, replyMsg);
      
      // Also send locations on a map
      for (const p of result.data) {
        const locMsg = await bot.sendLocation(chatId, p.latitude, p.longitude);
        trackMessage(chatId, locMsg);
        const nameMsg = await bot.sendMessage(chatId, `📍 ${p.full_name} (${p.type})`);
        trackMessage(chatId, nameMsg);
      }

    } else {
      const noResultsMsg = await bot.sendMessage(chatId, "I couldn't find any registered professionals nearby. You can try searching for general resources instead.");
      trackMessage(chatId, noResultsMsg);
    }
  } catch (error) {
    console.error('Error finding nearest professionals:', error);
    const errorMsg = await bot.sendMessage(chatId, 'Sorry, I ran into an error while searching. Please try again later.');
    trackMessage(chatId, errorMsg);
  }
  // Show the main menu again so the user can continue
  await sendMainMenu(chatId);
});

// Handle 'clear' command
bot.onText(/^clear$/i, async (msg) => {
    const chatId = msg.chat.id;
    
    // Also delete the user's "clear" message
    try {
        await bot.deleteMessage(chatId, msg.message_id);
    } catch (e) {
        // May fail if permissions are not right, just ignore.
    }

    const messagesToDelete = userBotMessages[chatId] || [];
    if (messagesToDelete.length > 0) {
        // Use Promise.allSettled to attempt to delete all, even if some fail (e.g., too old)
        await Promise.allSettled(
            messagesToDelete.map(messageId => bot.deleteMessage(chatId, messageId))
        );
    }

    // Clear the tracked messages for this user
    userBotMessages[chatId] = [];

    // Send a final confirmation message and the menu again
    const finalMsg = await bot.sendMessage(chatId, "Chat history cleared! For full privacy, you can also clear the chat from your side.");
    trackMessage(chatId, finalMsg);
    await sendMainMenu(chatId);
});

// PHQ-9 Assessment Handler
async function handlePHQ9Assessment(chatId) {
  const phq9Message = `📋 *PHQ-9 Depression Screening*

The PHQ-9 is a 9-item depression screening tool. Over the last 2 weeks, how often have you been bothered by any of the following problems?

Please rate each item on a scale of 0-3:
• 0 = Not at all
• 1 = Several days  
• 2 = More than half the days
• 3 = Nearly every day

*Note: This is a screening tool and not a diagnosis. Please consult a healthcare professional for proper evaluation.*

Would you like to start the assessment?`;

  const phq9Keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Start PHQ-9 Assessment",
            callback_data: "start_phq9"
          }
        ],
        [
          {
            text: "🔙 Back to Menu",
            callback_data: "back_to_menu"
          }
        ]
      ]
    }
  };

  const sentMsg = await bot.sendMessage(chatId, phq9Message, {
    parse_mode: 'Markdown',
    ...phq9Keyboard
  });
  trackMessage(chatId, sentMsg);
}

// GAD-7 Assessment Handler
async function handleGAD7Assessment(chatId) {
  const gad7Message = `📋 *GAD-7 Anxiety Screening*

The GAD-7 is a 7-item anxiety screening tool. Over the last 2 weeks, how often have you been bothered by the following problems?

Please rate each item on a scale of 0-3:
• 0 = Not at all
• 1 = Several days
• 2 = More than half the days  
• 3 = Nearly every day

*Note: This is a screening tool and not a diagnosis. Please consult a healthcare professional for proper evaluation.*

Would you like to start the assessment?`;

  const gad7Keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Start GAD-7 Assessment",
            callback_data: "start_gad7"
          }
        ],
        [
          {
            text: "🔙 Back to Menu",
            callback_data: "back_to_menu"
          }
        ]
      ]
    }
  };

  const sentMsg = await bot.sendMessage(chatId, gad7Message, {
    parse_mode: 'Markdown',
    ...gad7Keyboard
  });
  trackMessage(chatId, sentMsg);
}

// Find Hospitals Handler
async function handleFindHospitals(chatId) {
  const hospitalsMessage = `🏥 *Find Hospitals & Clinics*

I can help you find nearby mental health facilities. To provide accurate results, I'll need your location.

*Available options:*
• Share your current location
• Enter your city/area manually
• View general mental health resources

*Emergency: If you're in immediate crisis, please call emergency services or go to the nearest emergency room.*

What would you prefer?`;

  const hospitalsKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📍 Share Location",
            callback_data: "share_location"
          }
        ],
        [
          {
            text: "🏙️ Enter City Manually",
            callback_data: "enter_city"
          }
        ],
        [
          {
            text: "📚 General Resources",
            callback_data: "general_resources"
          }
        ],
        [
          {
            text: "🔙 Back to Menu",
            callback_data: "back_to_menu"
          }
        ]
      ]
    }
  };

  const sentMsg = await bot.sendMessage(chatId, hospitalsMessage, {
    parse_mode: 'Markdown',
    ...hospitalsKeyboard
  });
  trackMessage(chatId, sentMsg);
}

// Find Community Handler
async function handleFindCommunity(chatId) {
  const communityMessage = `👥 *Find Community Support*

Connect with local mental health communities and support groups. Here are some options:

*Available Communities:*
• Depression support groups
• Anxiety support groups  
• General mental health communities
• Online support forums
• Peer support networks

*Benefits of joining:*
• Share experiences with others
• Get emotional support
• Learn coping strategies
• Reduce feelings of isolation

Which type of community interests you?`;

  const communityKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "😔 Depression Support",
            callback_data: "depression_community"
          }
        ],
        [
          {
            text: "😰 Anxiety Support",
            callback_data: "anxiety_community"
          }
        ],
        [
          {
            text: "🧠 General Mental Health",
            callback_data: "general_community"
          }
        ],
        [
          {
            text: "💻 Online Forums",
            callback_data: "online_forums"
          }
        ],
        [
          {
            text: "🔙 Back to Menu",
            callback_data: "back_to_menu"
          }
        ]
      ]
    }
  };

  const sentMsg = await bot.sendMessage(chatId, communityMessage, {
    parse_mode: 'Markdown',
    ...communityKeyboard
  });
  trackMessage(chatId, sentMsg);
}

// Find Activity Handler
async function handleFindActivity(chatId) {
  const activityMessage = `🎯 *Find Mental Health Activities*

Discover mental health-related events, workshops, or activities around you:

*Available Activities:*
• Mindfulness workshops
• Meditation sessions
• Art therapy classes
• Exercise groups
• Educational seminars
• Social events

*Benefits:*
• Learn new coping skills
• Meet like-minded people
• Reduce stress and anxiety
• Improve overall well-being

What type of activity interests you?`;

  const activityKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🧘 Mindfulness & Meditation",
            callback_data: "mindfulness_activities"
          }
        ],
        [
          {
            text: "🎨 Art & Creative Therapy",
            callback_data: "art_therapy"
          }
        ],
        [
          {
            text: "🏃 Exercise & Movement",
            callback_data: "exercise_groups"
          }
        ],
        [
          {
            text: "📚 Educational Seminars",
            callback_data: "educational_seminars"
          }
        ],
        [
          {
            text: "🔙 Back to Menu",
            callback_data: "back_to_menu"
          }
        ]
      ]
    }
  };

  const sentMsg = await bot.sendMessage(chatId, activityMessage, {
    parse_mode: 'Markdown',
    ...activityKeyboard
  });
  trackMessage(chatId, sentMsg);
}

// Emergency Contact Handler
async function handleEmergencyContact(chatId) {
  const emergencyMessage = `🚨 *Emergency Mental Health Support (Malaysia)*

*If you're in immediate crisis or having thoughts of self-harm, please reach out now.*

🆘 **Call Emergency Services:**
• Dial *999* from any phone in Malaysia.

📞 **Crisis Hotlines (24/7):**
• *Befrienders KL:* 03-7627 2929
• *Talian Kasih:* 15999
• *MIASA Helpline:* 1-800-82-0066

🏥 **Go to the nearest emergency room (Jabatan Kecemasan) at any government hospital immediately.**

*You are not alone. Help is available.*

Would you like me to:
• Provide more crisis resources
• Help you find local emergency services
• Connect you with online crisis support`;

  const emergencyKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📞 More Crisis Resources",
            callback_data: "more_crisis_resources"
          }
        ],
        [
          {
            text: "🏥 Local Emergency Services",
            callback_data: "local_emergency"
          }
        ],
        [
          {
            text: "💻 Online Crisis Support",
            callback_data: "online_crisis_support"
          }
        ],
        [
          {
            text: "🔙 Back to Menu",
            callback_data: "back_to_menu"
          }
        ]
      ]
    }
  };

  const sentMsg = await bot.sendMessage(chatId, emergencyMessage, {
    parse_mode: 'Markdown',
    ...emergencyKeyboard
  });
  trackMessage(chatId, sentMsg);
}

async function handleMoreCrisisResources(chatId) {
    const resourcesMessage = `*Additional Malaysian Crisis Resources*

📞 *More Hotlines & Chat:*
• *Befrienders Malaysia (Find a center):* [https://www.befrienders.org.my/centre-in-malaysia](https://www.befrienders.org.my/centre-in-malaysia)
• *Talian Nur:* 15999
• *MIASA WhatsApp:* +6013-8781321

🌐 *Official Online Resources:*
• *MIASA (Mental Illness Awareness & Support Association):* [https://miasa.org.my/](https://miasa.org.my/)
• *MyHEALTH Portal (KKM):* [http://www.myhealth.gov.my/mental-health/](http://www.myhealth.gov.my/mental-health/)
• *Befrienders KL Facebook:* [https://www.facebook.com/BefriendersKL/](https://www.facebook.com/BefriendersKL/)

Please reach out to any of these resources if you need support.`;

    const resourcesKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔙 Back to Emergency Menu", callback_data: "emergency_contact" }
                ],
                [
                    { text: "🏠 Back to Main Menu", callback_data: "back_to_menu" }
                ]
            ]
        }
    };

    const sentMsg = await bot.sendMessage(chatId, resourcesMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...resourcesKeyboard
    });
    trackMessage(chatId, sentMsg);
}

async function handleLocalEmergency(chatId) {
    const message = "This feature is coming soon! For now, please call 999 or go to the nearest hospital's emergency department (Jabatan Kecemasan).";
    const sentMsg = await bot.sendMessage(chatId, message);
    trackMessage(chatId, sentMsg);
    await sendMainMenu(chatId);
}

async function handleOnlineCrisisSupport(chatId) {
    const message = "This feature is coming soon! In the meantime, please use the WhatsApp numbers and website links provided in 'More Crisis Resources'.";
    const sentMsg = await bot.sendMessage(chatId, message);
    trackMessage(chatId, sentMsg);
    await sendMainMenu(chatId);
}

// --- GAD-7 Assessment Functions ---

// Function to send a GAD-7 question or calculate the result
async function sendGAD7Question(chatId, messageId) {
    const state = userStates[chatId];
    const questionIndex = state.currentQuestion;

    if (questionIndex < gad7Questions.length) {
        const questionText = gad7Questions[questionIndex];
        const options = {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            ...gad7AnswerKeyboard
        };
        try {
            await bot.editMessageText(questionText, options);
        } catch (error) {
            if (!error.message.includes('message is not modified')) {
                console.error('Error sending GAD-7 question:', error);
            }
        }
    } else {
        await bot.editMessageText('Thank you for completing the assessment. Calculating your results...', {
            chat_id: chatId,
            message_id: messageId
        });
        await calculateAndShowGAD7Result(chatId);
    }
}

// Function to calculate score and show the final GAD-7 result
async function calculateAndShowGAD7Result(chatId) {
    const state = userStates[chatId];
    const score = state.score;

    let severity = "";
    let recommendation = "";

    if (score >= 0 && score <= 4) {
        severity = "Minimal Anxiety";
        recommendation = "Your score suggests minimal to no anxiety. Continue practicing self-care and monitoring your feelings.";
    } else if (score >= 5 && score <= 9) {
        severity = "Mild Anxiety";
        recommendation = "Your score suggests you may be experiencing mild anxiety. Self-help strategies like mindfulness, exercise, and stress management can be very effective.";
    } else if (score >= 10 && score <= 14) {
        severity = "Moderate Anxiety";
        recommendation = "Your score suggests moderate anxiety. It is recommended that you speak with a healthcare provider or a mental health professional to discuss your symptoms and potential treatment options.";
    } else { // 15-21
        severity = "Severe Anxiety";
        recommendation = "Your score indicates severe anxiety. It's very important to seek professional help. Please contact a doctor or mental health professional to create a treatment plan that's right for you.";
    }

    const resultMessage = `*GAD-7 Result*

*Your Score:* ${score}
*Severity:* ${severity}

*Recommendation:*
${recommendation}

*Disclaimer: This is a screening tool and not a diagnosis. Please consult a qualified healthcare professional for an accurate diagnosis and treatment plan.*`;

    const resultMsg = await bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });
    trackMessage(chatId, resultMsg);

    // Clean up the state
    delete userStates[chatId];

    // Show the main menu again
    await sendMainMenu(chatId);
}

// Send message utility
async function sendTelegramMessage(chatId, text) {
  try {
    return await bot.sendMessage(chatId, text);
  } catch (err) {
    console.error('DEBUG: sendMessage error:', err);
    throw err;
  }
}

const db = require('../models/db');

async function findNearestProfessionals(lat, lng) {
  // Search psychiatrists
  const [psychiatrists] = await db.query(`
    SELECT id, full_name, location, latitude, longitude, profile_image, 'Psychiatrist' as type
    FROM psychiatrists
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `);

  // Search counselors
  const [counselors] = await db.query(`
    SELECT id, full_name, location, latitude, longitude, profile_image, 'Counselor' as type
    FROM counselors
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `);

  function calcDist(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  // Combine and calculate distances
  const all = [...psychiatrists, ...counselors];

  all.forEach(entry => {
    // Ensure coordinates are numbers before calculation
    const lat1 = parseFloat(lat);
    const lng1 = parseFloat(lng);
    const lat2 = parseFloat(entry.latitude);
    const lng2 = parseFloat(entry.longitude);

    if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
      entry.distance = calcDist(lat1, lng1, lat2, lng2);
    } else {
      entry.distance = Infinity; // Place invalid entries at the end
    }
  });

  const MAX_RADIUS_KM = 30;

  // Filter out invalid entries and those outside the radius, then sort and slice
  return all
    .filter(entry => entry.distance <= MAX_RADIUS_KM)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
}

module.exports = { bot, sendTelegramMessage, findNearestProfessionals }; 