import { assertEquals } from "@std/assert";
import { daysInMonth, formDate, stripDate } from "@/utils/date.ts";

Deno.test("date.ts utils", async (t) => {
  await t.step("formDate", async (t) => {
    await t.step(
      "should return the current date in the format 'YYYY-MM-DD'",
      () => {
        const date = new Date();
        const expected = date.toISOString().split("T")[0];
        const result = formDate();
        assertEquals(result, expected);
      },
    );

    await t.step(
      "should return date with day 1 if the month is different from the active month",
      () => {
        const date = new Date("2021-01-10");
        const expectedDate = new Date(date);
        expectedDate.setDate(1);
        const expectedString = expectedDate.toISOString().split("T")[0];
        const result = formDate(expectedDate);
        assertEquals(result, expectedString);
      },
    );

    await t.step(
      "should return the passed date in the format 'YYYY-MM-DD'",
      () => {
        const date = new Date("2021-01-01");
        const expected = date.toISOString().split("T")[0];
        const result = formDate(date);
        assertEquals(result, expected);
      },
    );
  });

  await t.step("stripDate", async (t) => {
    await t.step("should return the year, month and day of the date", () => {
      const date = new Date("2021-01-01T00:00:00Z");
      const expected = { year: 2021, month: 1, day: 1 };
      const result = stripDate(date);
      assertEquals(result, expected);
    });
  });

  await t.step("daysInMonth", async (t) => {
    await t.step(
      "should return the number of days in the month (31 days)",
      () => {
        const month = 1;
        const year = 2021;
        const expected = 31;
        const result = daysInMonth(month, year);
        assertEquals(result, expected);
      },
    );

    await t.step(
      "should return the number of days in the month (30 days)",
      () => {
        const month = 4;
        const year = 2021;
        const expected = 30;
        const result = daysInMonth(month, year);
        assertEquals(result, expected);
      },
    );

    await t.step(
      "should return the number of days in the month (28 days)",
      () => {
        const month = 2;
        const year = 2021;
        const expected = 28;
        const result = daysInMonth(month, year);
        assertEquals(result, expected);
      },
    );
  });
});
