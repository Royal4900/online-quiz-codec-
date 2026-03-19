const Contact = require('../models/Contact');
const emailService = require('../services/emailService');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Store in database
    const contact = await Contact.create({ name, email, subject, message });

    // Send email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailService.sendContactEmail({ name, email, subject, message });
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
        // Still return success - message is stored in DB
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
      id: contact._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
