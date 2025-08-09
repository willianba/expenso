import { activeMonth } from "@/signals/menu.ts";

/**
 * This function receives a date and returns a string in the format "DD/MM/YYYY"
 * It returns the BR format by default. Used to display the date in the tables
 */
export const getFormattedDate = (date: Date | string) => {
  // TODO at some point make this come from user settings
  return Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

/**
 * This function receives a date and returns a string in the format "YYYY-MM-DD"
 * If no date is passed, it returns the current date
 *
 * @param {Date} [date] - (optional) Expense or income date to be formatted
 * @returns string
 */
export const formDate = (date?: Date) => {
  if (!date) {
    const d = new Date();
    const formMonth = activeMonth.value - 1;

    // change the date for day 1 if the month is different from the active month
    if (formMonth !== d.getMonth()) {
      d.setDate(1);
    }

    d.setMonth(activeMonth.value - 1);
    return d.toISOString().split("T")[0];
  }
  return new Date(date).toISOString().split("T")[0];
};

/**
 * This function returns the date of today in an object with the year, month and day
 */
export const today = () => {
  const date = new Date();
  return stripDate(date);
};

/**
 * This function receives a date and returns an object with the year, month and day
 */
export const stripDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return { year, month, day };
};

/**
 * This function receives a date and returns the number of days in that month
 * This is a hack. Returning the day 0 will get the last day of the previous month
 */
export const daysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

/**
 * Convert a date string from the user's timezone (GMT-3) to UTC for storage
 * This ensures that when the user inputs a local time, it gets stored as the
 * equivalent UTC time that will display correctly in their timezone
 */
export const parseUserTimezoneAsUTC = (dateString: string): Date => {
  // Parse the date as if it's in local time
  const localDate = new Date(dateString);
  
  // Adjust for GMT-3 timezone offset
  // GMT-3 means 3 hours behind UTC, so we add 3 hours to convert local time to UTC
  // This way, when the UI displays the UTC time in GMT-3, it shows the original time
  const gmtMinusThreeOffsetMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  
  return new Date(localDate.getTime() + gmtMinusThreeOffsetMs);
};
