import type { EmailProvider } from "./adapter";

export const MockEmailProvider: EmailProvider = {
  async send({ to, subject, html, customId }) {
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    console.log("[MockEmail] send", { to, subject, htmlLen: html.length, customId, messageId });
    return { messageId };
  },
};
