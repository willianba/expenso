import { SMTPClient, SendConfig } from "denomailer";
import { env } from "@/utils/env.ts";
import logger from "@/utils/logger.ts";

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
    try {
      await this.client.send(config);
      await this.client.close();
    } catch (error) {
      logger.error("Error sending email", { error });
    }
  }
}

export default EmailProvider.getInstance();
