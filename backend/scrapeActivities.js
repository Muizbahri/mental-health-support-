const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./config/db'); // your db connection using .env

async function scrapeAndSaveActivities(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let activities = [];

    // Arrays of possible selectors for each field
    const nameSelectors = ['.event-title', '.title', 'h3', 'h2', '.eds-event-card-content__title', '.font-semibold'];
    const dateSelectors = ['.event-date', '.date', 'time', '.eds-event-card-content__sub', '.eds-text-bs--fixed', '.block', '.event-datetime'];
    // Add time selectors for flexible time scraping
    const timeSelectors = ['.event-time', '.time', '.event-datetime', '.event-date-time', '.time-info', '.event-time-info'];
    const locationSelectors = [
      '.event-location',
      '.location',
      '.eds-event-card-content__sub-title',
      '.location-info__address-text',
      '.value'
    ];
    const descSelectors = ['.event-desc', '.description', 'p', '.eds-event-card-content__sub-content', '#event-details'];

    // Try to find event cards by common container selectors
    $('.event-listing, .event-card, .event-item, .search-event-card-wrapper, .eds-event-card-content__content').each((i, el) => {
      // Helper to try multiple selectors for a field
      const trySelectors = (selectors) => {
        for (const sel of selectors) {
          const val = $(el).find(sel).first().text().trim();
          if (val) return val;
        }
        return '';
      };

      const name = trySelectors(nameSelectors);
      const date = trySelectors(dateSelectors);
      const time = trySelectors(timeSelectors); // Scrape time using flexible selectors
      const location = trySelectors(locationSelectors);
      const description = trySelectors(descSelectors);

      // Only add if at least a name/title is found
      if (name) activities.push({ name, date, time, location, description });
    });

    if (activities.length === 0) {
      console.error('No activities found. The site may be JavaScript-rendered or selectors need updating.');
      return { success: false, message: 'No activities found. Try a different site or update selectors.' };
    }

    // Save each activity into the database (table: activities)
    for (const act of activities) {
      // Use INSERT IGNORE or ON DUPLICATE KEY UPDATE if you want to avoid duplicates
      await db.query(
        'INSERT INTO activities (name, date, location, description, url) VALUES (?, ?, ?, ?, ?)',
        [act.name, act.date, act.location, act.description, url]
      );
    }

    console.log('Scraping done & data saved!');
    return { success: true, message: 'Scraping done & data saved!' };
  } catch (err) {
    console.error('Scraping failed:', err.message);
    return { success: false, message: 'Scraping failed: ' + err.message };
  }
}

module.exports = scrapeAndSaveActivities; 