import { Handlers } from "$fresh/server.ts";
import { SignedInState } from "@/plugins/session.ts";
import PaymentMethodService, {
  PaymentMethod,
} from "@/db/models/payment-method.ts";

export const handler: Handlers<PaymentMethod, SignedInState> = {
  async GET(_req, ctx) {
    const paymentMethods = await PaymentMethodService.getAllByUserId(
      ctx.state.sessionUser!.id,
    );

    return Response.json(paymentMethods);
  },
};
