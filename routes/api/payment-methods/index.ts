import { RouteHandler } from "fresh";
import PaymentMethodService, {
  PaymentMethod,
} from "@/db/models/payment-method.ts";
import { SignedInState } from "@/utils/state.ts";

export const handler: RouteHandler<PaymentMethod, SignedInState> = {
  async GET(ctx) {
    const paymentMethods = await PaymentMethodService.getAllByUserId(
      ctx.state.sessionUser!.id,
    );

    return Response.json(paymentMethods);
  },
};
