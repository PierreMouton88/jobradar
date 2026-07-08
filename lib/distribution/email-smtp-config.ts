import { z } from "zod";

const smtpConfigSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  REPORT_EMAIL_FROM: z.email(),
  REPORT_EMAIL_TO: z.email(),
});

export type EmailSmtpConfig = z.infer<typeof smtpConfigSchema>;

export function getEmailSmtpConfig(): EmailSmtpConfig {
  return smtpConfigSchema.parse({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    REPORT_EMAIL_FROM: process.env.REPORT_EMAIL_FROM,
    REPORT_EMAIL_TO: process.env.REPORT_EMAIL_TO,
  });
}