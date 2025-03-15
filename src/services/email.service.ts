import { configureNodemailer } from "../configs/configure_nodemailer";


const transporter = configureNodemailer();

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${options.to}`);
    } catch (error) {
      console.error(`Error sending email to ${options.to}:`, error);
      throw new Error(`Failed to send email to ${options.to}`);
    }
  }
}
