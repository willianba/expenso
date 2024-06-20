import { signal } from "@preact/signals";

// can't use the `today` function from utils/date.ts because it uses `activeMonth`
// and generates a circular dependency
const today = new Date();
const monthOfToday = today.getMonth() + 1;
const yearOfToday = today.getFullYear();

export const activeMonth = signal(monthOfToday);
export const activeYear = signal(yearOfToday);
