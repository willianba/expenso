import { activeMonth } from "@/signals/menu.ts";

/**
 * This function receives a date and returns a string in the format "DD/MM/YYYY"
 * It returns the BR format by default. Used to display the date in the tables
 * The date is converted from UTC to the user's local timezone for display
 */
export const getFormattedDate = (date: Date | string) => {
  // TODO at some point make this come from user settings
  let displayDate: Date;
  
  try {
    // For client-side rendering, convert UTC to user timezone
    if (typeof window !== "undefined" && typeof Intl !== "undefined") {
      const userOffset = getUserTimezoneOffset();
      displayDate = convertUTCToUserTimezone(date, userOffset);
    } else {
      // Server-side rendering or fallback - display as-is
      displayDate = new Date(date);
    }
  } catch {
    // Fallback to original behavior if timezone functions fail
    displayDate = new Date(date);
  }
  
  return Intl.DateTimeFormat("pt-BR").format(displayDate);
};

/**
 * This function receives a date and returns a string in the format "YYYY-MM-DD"
 * If no date is passed, it returns the current date in the user's timezone
 * For editing, it converts UTC dates back to local timezone for the form input
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
  
  // For existing dates, convert from UTC to user timezone for editing
  // In test environments or server-side, maintain original behavior
  let displayDate: Date;
  try {
    if (typeof window !== "undefined" && typeof Intl !== "undefined") {
      const userOffset = getUserTimezoneOffset();
      displayDate = convertUTCToUserTimezone(date, userOffset);
    } else {
      displayDate = new Date(date);
    }
  } catch {
    // Fallback to original behavior if timezone functions fail
    displayDate = new Date(date);
  }
  
  return displayDate.toISOString().split("T")[0];
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
 * @param timezoneOffsetMinutes - The timezone offset in minutes from UTC (required)
 *                               - Negative values = behind UTC (e.g., GMT-3 = -180)
 *                               - Positive values = ahead of UTC (e.g., GMT+5 = 300)
 *                               - Same as Date.getTimezoneOffset() convention
 * @returns Date object adjusted for the timezone offset
 */
export const parseUserTimezoneAsUTC = (dateString: string, timezoneOffsetMinutes: number): Date => {
  // Parse the date as if it's in local time
  const localDate = new Date(dateString);
  
  // Convert minutes to milliseconds and adjust the date
  // If timezone is behind UTC (negative offset), we add the absolute value to convert to UTC
  // If timezone is ahead of UTC (positive offset), we subtract to convert to UTC
  const offsetMs = -timezoneOffsetMinutes * 60 * 1000;
  
  return new Date(localDate.getTime() + offsetMs);
};

/**
 * Get the user's timezone offset in minutes from the browser
 * This can be called from the client side to get the actual user timezone
 * 
 * @returns The timezone offset in minutes (negative for timezones behind UTC)
 */
export const getUserTimezoneOffset = (): number => {
  if (typeof window === "undefined") {
    // Server-side or test environment - return a default offset
    return -180; // GMT-3 default for compatibility
  }
  return new Date().getTimezoneOffset();
};

/**
 * Detect the user's timezone using Intl API
 * This provides the timezone identifier (e.g., "America/Sao_Paulo")
 * 
 * @returns The timezone identifier
 */
export const getUserTimezone = (): string => {
  if (typeof window === "undefined" || typeof Intl === "undefined") {
    // Server-side or test environment - return a default timezone
    return "America/Sao_Paulo"; // GMT-3 default for compatibility
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert a UTC date to the user's local timezone for display
 * This is the inverse of parseUserTimezoneAsUTC
 * 
 * @param utcDate - The UTC date to convert
 * @param timezoneOffsetMinutes - The timezone offset in minutes from UTC
 *                               - Same as Date.getTimezoneOffset() convention
 * @returns Date object adjusted to the user's timezone
 */
export const convertUTCToUserTimezone = (utcDate: Date | string, timezoneOffsetMinutes: number): Date => {
  const date = new Date(utcDate);
  
  // Convert minutes to milliseconds and adjust the date
  // Apply the opposite conversion of parseUserTimezoneAsUTC
  const offsetMs = timezoneOffsetMinutes * 60 * 1000;
  
  return new Date(date.getTime() + offsetMs);
};
