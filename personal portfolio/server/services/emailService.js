const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

exports.sendContactEmail = async (contactData) => {
  const transporter = createTransporter();
  const toEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    replyTo: contactData.email,
    subject: `Portfolio Contact: ${contactData.subject || 'New Message'}`,
    text: `
From: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject || 'No subject'}

Message:
${contactData.message}
    `,
    html: `
      <h3>New contact form submission</h3>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Subject:</strong> ${contactData.subject || 'No subject'}</p>
      <p><strong>Message:</strong></p>
      <p>${contactData.message.replace(/\n/g, '<br>')}</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
