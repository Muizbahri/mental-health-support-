require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const geoapifyRoutes = require('./routes/geoapify');
const mailRoutes = require('./routes/mail');
const telegramRoutes = require('./routes/telegram');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

const materialsRoutes = require('./routes/materials');
const feedbacksRoutes = require('./routes/feedbacks');
const appointmentsRoutes = require('./routes/appointments');
const emergencyCasesRoutes = require('./routes/emergency_cases');
const counselorsRoutes = require('./routes/counselors');
const psychiatristsRoutes = require('./routes/psychiatrists');
const publicUsersRoutes = require('./routes/publicUsers');
const ngoRoutes = require('./routes/ngo');
const referralRequestsRouter = require('./routes/referral_requests');
const scrapeActivitiesRoutes = require('./routes/scrape-activities');
const activitiesRoutes = require('./routes/activities');
const emailRoutes = require('./routes/emailRoutes');
const emailTestRoutes = require('./routes/emailTest');
const addCounselorRoute = require('./routes/addCounselor');
const psychiatristAppointmentsRoutes = require('./routes/psychiatrist_appointments');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', geoapifyRoutes);
app.use('/api', mailRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/feedbacks', feedbacksRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/emergency-cases', emergencyCasesRoutes);
app.use('/api/emergency_cases', emergencyCasesRoutes);
app.use('/api/psychiatrists', psychiatristsRoutes);
app.use('/api/counselors', counselorsRoutes);
app.use('/api/public-users', publicUsersRoutes);

// Add compatibility routes for public user endpoints
app.use('/api/user-public/login', (req, res, next) => {
  console.log('Redirecting from /api/user-public/login to /api/public-users/login');
  req.url = '/login';
  publicUsersRoutes(req, res, next);
});

// Add compatibility route for user profile
app.use('/api/user-public/profile', (req, res, next) => {
  console.log('Redirecting from /api/user-public/profile to /api/public-users/profile/me');
  req.url = '/profile/me';
  publicUsersRoutes(req, res, next);
});

// Add compatibility route for the users/user-public/profile endpoint  
app.use('/api/users/user-public/profile', (req, res, next) => {
  console.log('Redirecting from /api/users/user-public/profile to /api/public-users/profile/me');
  req.url = '/profile/me';
  publicUsersRoutes(req, res, next);
});

// Add compatibility route for profile image upload
app.use('/api/users/user-public/upload-profile-image', (req, res, next) => {
  console.log('Redirecting from /api/users/user-public/upload-profile-image to /api/public-users/upload-profile-image');
  req.url = '/upload-profile-image';
  publicUsersRoutes(req, res, next);
});

// Add backward compatibility for the old route
app.use('/api/add-public', (req, res, next) => {
  console.log('Redirecting from deprecated /api/add-public to /api/public-users');
  req.url = '/';
  publicUsersRoutes(req, res, next);
});

app.use('/api', ngoRoutes);
app.use('/api', referralRequestsRouter);
app.use('/api/activities', activitiesRoutes);
app.use('/api/scrape-activities', scrapeActivitiesRoutes);
app.use('/api/email', emailRoutes);
app.use('/api', emailTestRoutes);
app.use('/api', addCounselorRoute);
app.use('/api/psychiatrist-appointments', psychiatristAppointmentsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Initialize database connection
require('./models/db');

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
