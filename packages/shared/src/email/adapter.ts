export interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
    customId?: string;
  }): Promise<{ messageId: string }>;
}
