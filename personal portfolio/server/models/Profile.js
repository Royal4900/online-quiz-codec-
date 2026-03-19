const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  bio: { type: String, required: true },
  avatar: { type: String },
  email: { type: String },
  phone: { type: String },
  location: { type: String },
  resumeUrl: { type: String },
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Profile', profileSchema);
