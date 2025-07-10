import { createDefine } from "fresh";
import { User } from "@/db/models/user.ts";

export type State = {
  sessionUser?: User;
};

export type SignedInState = Required<State>;

export const define = createDefine<State>();
