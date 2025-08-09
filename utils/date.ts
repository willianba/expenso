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
 * Convert a date string from the user's timezone to UTC for storage
 * This ensures that when the user inputs a local time, it gets stored as the
 * equivalent UTC time that will display correctly in their timezone
 * 
 * @param dateString - The date string to convert
 * @param timezoneOffsetMinutes - The timezone offset in minutes from UTC (optional, defaults to -180 for GMT-3)
 *                               - Negative values = behind UTC (e.g., GMT-3 = -180)
 *                               - Positive values = ahead of UTC (e.g., GMT+5 = 300)
 *                               - Same as Date.getTimezoneOffset() convention
 * @returns Date object adjusted for the timezone offset
 */
export const parseUserTimezoneAsUTC = (dateString: string, timezoneOffsetMinutes?: number): Date => {
  // Parse the date as if it's in local time
  const localDate = new Date(dateString);
  
  // Default to GMT-3 (180 minutes behind UTC) for backward compatibility
  // Negative values mean behind UTC, positive values mean ahead of UTC
  const offsetMinutes = timezoneOffsetMinutes ?? -180; // GMT-3 = -180 minutes
  
  // Convert minutes to milliseconds and adjust the date
  // If timezone is behind UTC (negative offset), we add the absolute value to convert to UTC
  // If timezone is ahead of UTC (positive offset), we subtract to convert to UTC
  const offsetMs = -offsetMinutes * 60 * 1000;
  
  return new Date(localDate.getTime() + offsetMs);
};

/**
 * Get the user's timezone offset in minutes from the browser
 * This can be called from the client side to get the actual user timezone
 * 
 * @returns The timezone offset in minutes (negative for timezones behind UTC)
 */
export const getUserTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Detect the user's timezone using Intl API
 * This provides the timezone identifier (e.g., "America/Sao_Paulo")
 * 
 * @returns The timezone identifier
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
