import nodemailer from "nodemailer";
import type { EmailSmtpConfig } from "./email-smtp-config";

export type SendEmailInput = {
  subject: string;
  text: string;
};

export type SendEmailResult = {
  messageId: string;
  accepted: string[];
  rejected: string[];
};

export async function sendEmailWithSmtp(
  input: SendEmailInput,
  config: EmailSmtpConfig,
): Promise<SendEmailResult> {
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    },
  });

  const result = await transporter.sendMail({
    from: config.REPORT_EMAIL_FROM,
    to: config.REPORT_EMAIL_TO,
    subject: input.subject,
    text: input.text,
  });

  return {
    messageId: result.messageId,
    accepted: result.accepted.map(String),
    rejected: result.rejected.map(String),
  };
}
