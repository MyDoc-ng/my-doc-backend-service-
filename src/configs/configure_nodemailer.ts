import nodemailer, { Transporter } from "nodemailer";

export function configureNodemailer(): Transporter {
  const appEnv = process.env.APP_ENV || "development";

  if (appEnv === "development") {
    // MailHog (Development)
    console.log("Using MailHog for email");
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST || "localhost", // Fallback to localhost
      port: parseInt(process.env.MAIL_PORT || "1025", 10), // Fallback to 1025
      secure: false,
      ignoreTLS: true,
    });
  } else {
    // Production (SMTP Example)
    console.log("Using SMTP for email");
    return nodemailer.createTransport({
      service: process.env.MAIL_MAILER,
      port: process.env.MAIL_PORT,
      secure: process.env.APP_ENV == "production" ? true : false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }
}
