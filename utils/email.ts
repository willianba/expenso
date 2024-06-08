import { SMTPClient, SendConfig } from "denomailer";
import { env } from "@/utils/env.ts";

class EmailProvider {
  private readonly client: SMTPClient;
  private static instance: EmailProvider;

  private constructor() {
    this.client = new SMTPClient({
      connection: {
        hostname: "smtp.resend.com",
        port: 2465,
        tls: true,
        auth: {
          username: "resend",
          password: env.RESEND_API_KEY,
        },
      },
    });
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new EmailProvider();
    }

    return this.instance;
  }

  public async send(config: SendConfig) {
    await this.client.send(config);
    await this.client.close();
  }
}

export default EmailProvider.getInstance();
