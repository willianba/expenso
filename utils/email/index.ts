import { Resend } from "resend";
import { env } from "@/utils/env.ts";

class EmailProvider {
  readonly #client: Resend;
  static #instance: EmailProvider;

  private constructor() {
    this.#client = new Resend(env.RESEND_API_KEY);
  }

  private static getInstance() {
    if (!this.#instance) {
      this.#instance = new EmailProvider();
    }

    return this.#instance;
  }

  public static get client() {
    return EmailProvider.getInstance().#client;
  }
}

export default EmailProvider;
