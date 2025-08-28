const nodemailer = require("nodemailer");
const logger = require("./logger");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error("Email config error:", error);
      } else {
        console.log("✅ Gmail server is ready to send emails");
      }
    });
  }

  /**
   * Send a registration email
   * @param {Object} options
   * @param {string} options.to
   * @param {string} options.name
   * @param {string} options.code
   */
  async sendRegisterMail({ to, name, email, password }) {
    const mailOptions = {
      from: `"MiniWeather Admin Page" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Your Account Has Been Created",
      html: `
      <h2>Welcome, ${name} 👋</h2>
      <p>Your account has been created by the administrator.</p>
      
      <h3>Login Credentials:</h3>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>

      <small>
        If you did not request this account, contact the administrator immediately.
      </small>
    `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Credentials email sent:", info.messageId);
      return info;
    } catch (error) {
      logger.error("Failed to send credentials email:", error);
      throw error;
    }
  }

  async sendResetPasswordMail({ to, name, code }) {
    const mailOptions = {
      from: `"MiniWeather Admin Page" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Reset Your Password",
      html: `
        <h2>Hello, ${name}</h2>
        <p>You requested a password reset. Use the code below:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore it.</p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Reset password code sent:", info.messageId);
      return info;
    } catch (error) {
      logger.error("Failed to send password reset email:", error);
      throw error;
    }
  }
}

module.exports = new EmailService();
