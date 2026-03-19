const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const projectController = require('../controllers/projectController');
const skillController = require('../controllers/skillController');
const contactController = require('../controllers/contactController');
const { contactValidation, handleValidationErrors } = require('../middleware/validateContact');

// Portfolio data APIs
router.get('/profile', profileController.getProfile);
router.get('/projects', projectController.getProjects);
router.get('/skills', skillController.getSkills);

// Contact form
router.post('/contact', contactValidation, handleValidationErrors, contactController.submitContact);

module.exports = router;
