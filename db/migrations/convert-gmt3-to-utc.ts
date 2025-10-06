/**
 * Migration: Convert GMT-3 stored dates to UTC
 * 
 * This migration converts all existing expense and income dates from GMT-3 to UTC.
 * Since all existing data was stored with GMT-3 offset applied, we need to add 3 hours
 * (180 minutes) to convert them back to their original UTC time.
 */

import { kv } from "@/db/kv.ts";
import { RawExpense } from "@/db/models/expense.ts";
import { RawIncome } from "@/db/models/income.ts";
import logger from "@/utils/logger.ts";

async function convertExpensesToUTC() {
  logger.info("Starting migration: Converting expense dates from GMT-3 to UTC");
  
  let convertedExpensesCount = 0;
  const expenseEntries = kv.list<RawExpense>({ prefix: ["expenses"] });
  
  for await (const entry of expenseEntries) {
    const expense = entry.value;
    
    // Convert GMT-3 to UTC by adding 3 hours (180 minutes)
    const originalDate = new Date(expense.payment.date);
    const utcDate = new Date(originalDate.getTime() + (180 * 60 * 1000));
    
    // Update the expense with the UTC date
    const updatedExpense = {
      ...expense,
      payment: {
        ...expense.payment,
        date: utcDate,
      },
    };
    
    // Update all relevant keys
    const expenseKey = ["expenses", expense.userId, expense.id];
    const correlationKey = [
      "expenses_by_correlation",
      expense.userId,
      expense.correlationId,
      expense.id,
    ];
    const dateKey = [
      "expenses_by_date",
      expense.userId,
      utcDate.getFullYear(),
      utcDate.getMonth() + 1,
      expense.id,
    ];
    
    // Delete the old date key (with original date)
    const oldDateKey = [
      "expenses_by_date",
      expense.userId,
      originalDate.getFullYear(),
      originalDate.getMonth() + 1,
      expense.id,
    ];
    
    const result = await kv
      .atomic()
      .set(expenseKey, updatedExpense)
      .set(correlationKey, updatedExpense)
      .set(dateKey, updatedExpense)
      .delete(oldDateKey)
      .commit();
    
    if (result.ok) {
      convertedExpensesCount++;
      if (convertedExpensesCount % 100 === 0) {
        logger.info(`Converted ${convertedExpensesCount} expenses`);
      }
    } else {
      logger.error(`Failed to convert expense ${expense.id}`);
    }
  }
  
  logger.info(`Migration completed: Converted ${convertedExpensesCount} expenses from GMT-3 to UTC`);
}

async function convertIncomeToUTC() {
  logger.info("Starting migration: Converting income dates from GMT-3 to UTC");
  
  let convertedIncomeCount = 0;
  const incomeEntries = kv.list<RawIncome>({ prefix: ["income"] });
  
  for await (const entry of incomeEntries) {
    const income = entry.value;
    
    // Convert GMT-3 to UTC by adding 3 hours (180 minutes)
    const originalDate = new Date(income.date);
    const utcDate = new Date(originalDate.getTime() + (180 * 60 * 1000));
    
    // Update the income with the UTC date
    const updatedIncome = {
      ...income,
      date: utcDate,
    };
    
    // Update all relevant keys
    const incomeKey = ["income", income.userId, income.id];
    const dateKey = [
      "income_by_date",
      income.userId,
      utcDate.getFullYear(),
      utcDate.getMonth() + 1,
      income.id,
    ];
    
    // Delete the old date key (with original date)
    const oldDateKey = [
      "income_by_date",
      income.userId,
      originalDate.getFullYear(),
      originalDate.getMonth() + 1,
      income.id,
    ];
    
    const result = await kv
      .atomic()
      .set(incomeKey, updatedIncome)
      .set(dateKey, updatedIncome)
      .delete(oldDateKey)
      .commit();
    
    if (result.ok) {
      convertedIncomeCount++;
      if (convertedIncomeCount % 100 === 0) {
        logger.info(`Converted ${convertedIncomeCount} income records`);
      }
    } else {
      logger.error(`Failed to convert income ${income.id}`);
    }
  }
  
  logger.info(`Migration completed: Converted ${convertedIncomeCount} income records from GMT-3 to UTC`);
}

export async function runGMT3ToUTCMigration() {
  logger.info("Starting GMT-3 to UTC migration");
  
  try {
    await convertExpensesToUTC();
    await convertIncomeToUTC();
    logger.info("GMT-3 to UTC migration completed successfully");
  } catch (error) {
    logger.error("GMT-3 to UTC migration failed", { error });
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.main) {
  await runGMT3ToUTCMigration();
}