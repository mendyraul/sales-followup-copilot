import nodemailer from "nodemailer";
import { appUrl } from "./config";
export const smtpConfigured = () =>
  !!process.env.SMTP_URL && !!process.env.SMTP_FROM;
export async function sendOperatorEmail(
  to: string,
  subject: string,
  body: string,
) {
  if (!smtpConfigured()) throw new Error("SMTP_NOT_CONFIGURED");
  const url = new URL(process.env.SMTP_URL!);
  if (!["smtp:", "smtps:"].includes(url.protocol))
    throw new Error("INVALID_SMTP_URL");
  const local = ["localhost", "127.0.0.1", "[::1]", "mailpit"].includes(
    url.hostname,
  );
  const transport = nodemailer.createTransport({
    host: url.hostname,
    port: Number(url.port || (url.protocol === "smtps:" ? 465 : 587)),
    secure: url.protocol === "smtps:",
    requireTLS: !local,
    auth: url.username
      ? {
          user: decodeURIComponent(url.username),
          pass: decodeURIComponent(url.password),
        }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
  });
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: body + "\n\n" + appUrl(),
    });
  } finally {
    transport.close();
  }
}
