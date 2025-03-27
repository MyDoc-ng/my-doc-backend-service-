import path from "path";
import fs from "fs";
import { configureNodemailer } from "../configs/configure_nodemailer";
import Handlebars from "handlebars";
import logger from "../logger";


const transporter = configureNodemailer();

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string,
  replacements: Record<string, string>
}

export class EmailService {
  static async sendEmail(options: SendEmailOptions): Promise<void> {

    const emailHtml = EmailService.loadTemplate(options.templateName, options.replacements);

    try {
      const mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: options.to,
        subject: options.subject,
        html: emailHtml,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${options.to}`);
    } catch (error) {
      console.error(`Error sending email to ${options.to}:`, error);
      throw new Error(`Failed to send email to ${options.to}`);
    }
  }

  // Function to load and process HTML templates
static loadTemplate(templateName: string, replacements: Record<string, string>): string {
  try {
    const templatePath = path.join(__dirname, "../emails/templates", `${templateName}.html`);

    logger.debug(`Loading email template: ${templatePath}`);
    let templateHtml = fs.readFileSync(templatePath, "utf8");

    // Compile and replace placeholders in the template
    const compiledTemplate = Handlebars.compile(templateHtml);
    return compiledTemplate(replacements);
  } catch (error) {
    console.error("Error loading email template:", error);
    throw new Error("Could not load email template");
  }
};
}
