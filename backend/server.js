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
const usersRoutes = require('./routes/users');
const materialsRoutes = require('./routes/materials');
const feedbacksRoutes = require('./routes/feedbacks');
const appointmentsRoutes = require('./routes/appointments');
const emergencyCasesRoutes = require('./routes/emergency_cases');
const counselorsRoutes = require('./routes/counselors');
const psychiatristsRoutes = require('./routes/psychiatrists');
const publicUserRouter = require('./routes/publicUser');
const patientCasesRoutes = require('./routes/patientCases');

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
app.use('/api/emergency_cases', emergencyCasesRoutes);
app.use('/api', counselorsRoutes);
app.use('/api', psychiatristsRoutes);
app.use('/api', usersRoutes);
app.use('/api/user-public', publicUserRouter);
app.use('/api/patient-cases', patientCasesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
require('./utils/telegram');
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
