/**
 * Seed script - run with: node server/scripts/seed.js
 * Creates sample profile, projects, and skills in MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

const seedProfile = {
  name: 'John Doe',
  title: 'Full-Stack Developer',
  bio: 'Passionate about building elegant solutions to complex problems. Experienced in modern web technologies with a focus on clean code and user experience.',
  email: 'john@example.com',
  location: 'New York, NY',
  socialLinks: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com'
  }
};

const seedProjects = [
  { title: 'E-Commerce Platform', description: 'Full-featured online store with cart, checkout, and admin dashboard.', technologies: ['Node.js', 'React', 'MongoDB'], order: 1 },
  { title: 'Task Management App', description: 'Kanban-style task manager with real-time collaboration.', technologies: ['Express', 'Vue.js', 'Socket.io'], order: 2 },
  { title: 'Weather Dashboard', description: 'Real-time weather data with charts and forecasts.', technologies: ['JavaScript', 'API Integration'], order: 3 }
];

const seedSkills = [
  { name: 'HTML5', category: 'Frontend', level: 5, order: 1 },
  { name: 'CSS3', category: 'Frontend', level: 5, order: 2 },
  { name: 'JavaScript', category: 'Frontend', level: 5, order: 3 },
  { name: 'Node.js', category: 'Backend', level: 5, order: 1 },
  { name: 'Express.js', category: 'Backend', level: 5, order: 2 },
  { name: 'MongoDB', category: 'Database', level: 5, order: 1 }
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await Profile.deleteMany({});
  await Project.deleteMany({});
  await Skill.deleteMany({});
  await Profile.create(seedProfile);
  await Project.create(seedProjects);
  await Skill.create(seedSkills);
  console.log('Database seeded successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
