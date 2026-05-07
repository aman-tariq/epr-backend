import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// === NEW: Environment Variables Debug ===
console.log("=== ENVIRONMENT VARIABLES LOADED ===");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length || 0);
console.log("CONTACT_EMAIL:", process.env.CONTACT_EMAIL);
console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE);
console.log("==================================");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create email transporter
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const subjectMap: { [key: string]: string } = {
      'credit-trading': 'Credit Trading',
      'epr-solutions': 'EPR Solutions',
      'technical-support': 'Technical Support',
      'waste-management': 'Waste Management',
      'other': 'Other'
    };

    const subjectDisplay = subjectMap[subject] || 'General Inquiry';

    const adminMailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.CONTACT_EMAIL || 'info@eprnexuss.com',
      subject: `[${subjectDisplay}] New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Subject:</strong> ${subjectDisplay}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    const userMailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'We received your message - EPR Nexuss',
      html: `
        <h2>Thank you for contacting EPR Nexuss</h2>
        <p>Hi ${name},</p>
        <p>We've received your <strong>${subjectDisplay.toLowerCase()}</strong> and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>EPR Nexuss Team</p>
      `,
    };

    console.log('Attempting to send emails...');
    console.log('From:', process.env.EMAIL_FROM);
    console.log('To Admin:', process.env.CONTACT_EMAIL);
    console.log('To User:', email);

    // Send both emails
    await transporter.sendMail(adminMailOptions);
    console.log('✅ Admin email sent successfully');
    
    await transporter.sendMail(userMailOptions);
    console.log('✅ User email sent successfully');

    res.json({ success: true, message: 'Email sent successfully!' });

  } catch (error: any) {
    console.error('🚨 FULL EMAIL ERROR 🚨');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Full Error:', error);

    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message || 'Unknown error' 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});