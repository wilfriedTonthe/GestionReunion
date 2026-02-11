const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const meetingRoutes = require('./routes/meetings');
const fineRoutes = require('./routes/fines');
const voteRoutes = require('./routes/votes');
const attendanceRoutes = require('./routes/attendance');
const announcementRoutes = require('./routes/announcements');

const { startReminderScheduler } = require('./utils/reminderScheduler');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/regioconnect')
  .then(() => {
    console.log('✅ MongoDB connecté');
    startReminderScheduler();
  })
  .catch(err => console.error('❌ Erreur MongoDB:', err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RegioConnect API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur RegioConnect démarré sur le port ${PORT}`);
});
