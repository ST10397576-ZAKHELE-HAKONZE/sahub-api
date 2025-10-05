require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sahubdb';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful', email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// News (for demo)

app.get('/api/news', (req, res) => {
  res.json([
    {
      id: 1,
      title: "Load Shedding Stage 4 Announced",
      body: "Eskom has declared Stage 4 load shedding starting at 18:00 tonight due to multiple generator failures.",
      category: "Energy",
      timestamp: new Date().toISOString(),
      source: "EskomSePush"
    },
    {
      id: 2,
      title: "Heavy Rain Expected in Gauteng",
      body: "The South African Weather Service warns of severe thunderstorms and flooding in Johannesburg and Pretoria.",
      category: "Weather",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      source: "SA Weather Service"
    },
    {
      id: 3,
      title: "New Job Portal Launched for Youth",
      body: "The Department of Employment and Labour has launched a free job-matching platform for graduates.",
      category: "Jobs",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      source: "Careers24"
    }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});