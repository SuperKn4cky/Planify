import nodemailer, { type Transporter } from "nodemailer";

type UserInfo = {
  email: string;
  first_name: string;
  last_name: string;
};

export default class MailService {
  private transporter: Transporter;
  private from: string = "planify@ecole-89.online";

  public constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  }

}
