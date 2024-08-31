// LOAD LIB
const nodemailer = require("nodemailer");
// LOAD CONFIG
require("dotenv").config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendMail(to, subject, text, html) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_USER, // Ganti dengan nama Anda
        to,
        subject,
        text,
        html,
      });
      console.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      console.error(`Error sending email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
