const express = require('express');
const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
console.log('ENV Loaded:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Undefined',
  SECRET_KEY: process.env.SECRET_KEY ? 'Set' : 'Undefined',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Undefined',
  PORT: process.env.PORT ? 'Set' : 'Undefined'
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 requests per IP
  message: 'Too many login attempts, please try again after 15 minutes'
});
app.use('/api/users/login', loginLimiter);

// Routes
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/doctors', doctorRoutes);

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/patient', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'patient.html')));
app.get('/doctor', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'doctor.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'signup.html')));
app.get('/2fa', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', '2fa.html')));
app.get('/verify-2fa', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'verify-2fa.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'profile.html')));

const certPath = path.join(__dirname, 'cert', 'cert.pem');
const keyPath = path.join(__dirname, 'cert', 'key.pem');

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const PORT = process.env.PORT || 3000;

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
  });