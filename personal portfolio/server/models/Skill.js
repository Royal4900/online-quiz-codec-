const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g. 'Frontend', 'Backend', 'Tools'
  level: { type: Number, min: 1, max: 5 }, // 1-5 or percentage
  order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Skill', skillSchema);
