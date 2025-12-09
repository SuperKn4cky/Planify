import nodemailer, { type Transporter } from "nodemailer";

type UserInfo = {
  email: string;
  first_name: string;
  last_name: string;
};

export default class MailService {
  private transporter: Transporter;
  private from: string = "planify@ecole-89.online";
  private appDomain: string;

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

    this.appDomain = process.env.APP_DOMAIN ?? "localhost";
  }

  public async sendContactInvitation(opts: {
    invitee: UserInfo;
    inviter: UserInfo;
    token: string;
  }): Promise<void> {
    const acceptUrl = `https://${this.appDomain}/contacts/accept?token=${encodeURIComponent(
      opts.token,
    )}`;

    await this.transporter.sendMail({
      from: this.from,
      to: opts.invitee.email,
      subject: "Invitation à devenir contact sur Planify",
      text: [
        `Bonjour ${opts.invitee.first_name},`,
        ``,
        `${opts.inviter.first_name} ${opts.inviter.last_name} souhaite vous ajouter à ses contacts sur Planify.`,
        `Pour accepter cette invitation, ouvrez le lien suivant :`,
        acceptUrl,
      ].join("\n"),
      html: [
        `<p>Bonjour ${opts.invitee.first_name},</p>`,
        `<p>${opts.inviter.first_name} ${opts.inviter.last_name} souhaite vous ajouter à ses contacts sur Planify.</p>`,
        `<p>Pour accepter cette invitation, cliquez sur le lien ci‑dessous :</p>`,
        `<p><a href="${acceptUrl}">Accepter l’invitation</a></p>`,
      ].join(""),
    });
  }
}