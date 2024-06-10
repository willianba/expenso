import { signal } from "@preact/signals";
import { today } from "@/utils/date.ts";

export const activeMonth = signal(today().month);
export const activeYear = signal(today().year);
