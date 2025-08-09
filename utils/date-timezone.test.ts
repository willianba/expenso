import { assertEquals } from "@std/assert";
import { parseUserTimezoneAsUTC, getUserTimezoneOffset, getUserTimezone } from "./date.ts";

Deno.test("parseUserTimezoneAsUTC should adjust for GMT-3 timezone (default behavior)", () => {
  // Test with a date string that represents Aug 8, 2024, 22:00 in GMT-3
  const userDateString = "2024-08-08T22:00:00";
  const result = parseUserTimezoneAsUTC(userDateString); // Uses default GMT-3
  
  // The result should be adjusted for GMT-3 (add 3 hours)
  // Aug 8, 22:00 GMT-3 should become Aug 9, 01:00 UTC
  assertEquals(result.getUTCFullYear(), 2024);
  assertEquals(result.getUTCMonth(), 7); // August is month 7 (0-indexed) 
  assertEquals(result.getUTCDate(), 9); // Should be next day due to timezone adjustment
  assertEquals(result.getUTCHours(), 1); // 22 + 3 = 25, which is 1 AM next day
  assertEquals(result.getUTCMinutes(), 0);
});

Deno.test("parseUserTimezoneAsUTC should handle custom timezone offset", () => {
  // Test with GMT+5 timezone (300 minutes ahead of UTC)
  const userDateString = "2024-08-08T22:00:00";
  const result = parseUserTimezoneAsUTC(userDateString, 300); // GMT+5 = 300 minutes ahead
  
  // 22:00 GMT+5 should become 17:00 UTC same day (subtract 5 hours)
  assertEquals(result.getUTCFullYear(), 2024);
  assertEquals(result.getUTCMonth(), 7); // August is month 7 (0-indexed)
  assertEquals(result.getUTCDate(), 8); // Same day
  assertEquals(result.getUTCHours(), 17); // 22 - 5 = 17
  assertEquals(result.getUTCMinutes(), 0);
});

Deno.test("parseUserTimezoneAsUTC should handle GMT-8 timezone", () => {
  // Test with GMT-8 timezone (480 minutes behind UTC)
  const userDateString = "2024-08-08T22:00:00";
  const result = parseUserTimezoneAsUTC(userDateString, -480); // GMT-8 = -480 minutes offset
  
  // 22:00 GMT-8 should become 06:00 UTC next day (add 8 hours)
  assertEquals(result.getUTCFullYear(), 2024);
  assertEquals(result.getUTCMonth(), 7); // August is month 7 (0-indexed)
  assertEquals(result.getUTCDate(), 9); // Next day due to timezone adjustment
  assertEquals(result.getUTCHours(), 6); // 22 + 8 = 30, which is 6 AM next day
  assertEquals(result.getUTCMinutes(), 0);
});

Deno.test("parseUserTimezoneAsUTC should handle date-only input with default GMT-3", () => {
  // Test with just a date (no time)
  const dateOnly = "2024-08-08";
  const result = parseUserTimezoneAsUTC(dateOnly);
  
  // Should adjust for GMT-3: midnight GMT-3 becomes 3 AM UTC same day
  assertEquals(result.getUTCFullYear(), 2024);
  assertEquals(result.getUTCMonth(), 7); // August is month 7 (0-indexed)
  assertEquals(result.getUTCDate(), 8); // Same day since midnight + 3 hours = 3 AM
  assertEquals(result.getUTCHours(), 3); // 0 + 3 = 3
  assertEquals(result.getUTCMinutes(), 0);
});

Deno.test("parseUserTimezoneAsUTC should handle cross-day boundary with default GMT-3", () => {
  // Test with late evening time that crosses into next day
  const lateEvening = "2024-08-31T23:00:00";
  const result = parseUserTimezoneAsUTC(lateEvening);
  
  // 23:00 GMT-3 + 3 hours = 02:00 UTC next day (Sept 1)
  assertEquals(result.getUTCFullYear(), 2024);
  assertEquals(result.getUTCMonth(), 8); // September is month 8 (0-indexed)
  assertEquals(result.getUTCDate(), 1); // Should be Sept 1 due to crossing midnight
  assertEquals(result.getUTCHours(), 2); // 23 + 3 = 26, which is 2 AM next day
  assertEquals(result.getUTCMinutes(), 0);
});

Deno.test("parseUserTimezoneAsUTC should handle UTC timezone (no offset)", () => {
  // Test with UTC timezone (0 offset)
  const userDateString = "2024-08-08T22:00:00";
  const result = parseUserTimezoneAsUTC(userDateString, 0);
  
  // UTC time should remain unchanged
  assertEquals(result.getUTCFullYear(), 2024);
  assertEquals(result.getUTCMonth(), 7); // August is month 7 (0-indexed)
  assertEquals(result.getUTCDate(), 8);
  assertEquals(result.getUTCHours(), 22);
  assertEquals(result.getUTCMinutes(), 0);
});

Deno.test("getUserTimezoneOffset should return a number", () => {
  const offset = getUserTimezoneOffset();
  assertEquals(typeof offset, "number");
});

Deno.test("getUserTimezone should return a string", () => {
  const timezone = getUserTimezone();
  assertEquals(typeof timezone, "string");
  // Should be a valid timezone identifier format
  assertEquals(timezone.includes("/"), true);
});