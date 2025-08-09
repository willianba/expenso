# Timezone Handling Implementation

The timezone handling has been completely redesigned to use UTC as the storage standard with proper user timezone conversion. This removes the hardcoded GMT-3 dependency and makes the system work for users worldwide.

## Key Changes

### 1. Updated `parseUserTimezoneAsUTC` Function

The function now **requires** a timezone offset parameter and no longer has a GMT-3 default:

```typescript
// Before (hardcoded GMT-3 default)
const date = parseUserTimezoneAsUTC("2024-08-08T22:00:00"); // Always used GMT-3

// After (requires timezone parameter)
const userOffset = getUserTimezoneOffset(); // Detect from browser
const date = parseUserTimezoneAsUTC("2024-08-08T22:00:00", userOffset);

// Or specify any timezone
parseUserTimezoneAsUTC("2024-08-08T22:00:00", -180); // GMT-3
parseUserTimezoneAsUTC("2024-08-08T22:00:00", 300);  // GMT+5
parseUserTimezoneAsUTC("2024-08-08T22:00:00", -480); // GMT-8
```

### 2. New `convertUTCToUserTimezone` Function

For displaying UTC dates in the user's local timezone:

```typescript
// Convert UTC date back to user timezone for display
const utcDate = new Date("2024-08-08T22:00:00.000Z");
const userOffset = getUserTimezoneOffset();
const localDate = convertUTCToUserTimezone(utcDate, userOffset);
```

### 3. Helper Functions

```typescript
// Get user's timezone offset in minutes (browser-side)
const offset = getUserTimezoneOffset(); // Returns offset like -180 for GMT-3

// Get user's timezone identifier (browser-side) 
const timezone = getUserTimezone(); // Returns "America/Sao_Paulo"
```

## Implementation Examples

### Frontend Form Updates

The frontend forms now automatically detect the user's timezone and send it to the backend:

```typescript
// In ExpenseForm.tsx or IncomeForm.tsx
import { getUserTimezoneOffset } from "@/utils/date.ts";

const submitForm = async () => {
  const formData = new FormData(formRef.current!);
  
  // Automatically detect and include user timezone
  const userTimezoneOffset = getUserTimezoneOffset();
  formData.append("timezoneOffset", userTimezoneOffset.toString());
  
  // Submit to API
  await fetch("/api/expenses", { method: "POST", body: formData });
};
```

### Backend API Updates

API endpoints now use the timezone offset from the frontend:

```typescript
// In routes/api/expenses/index.ts
export const handler: RouteHandler = {
  async POST(ctx) {
    const { paymentDate, timezoneOffset, ...otherData } = 
      CreateExpenseSchema.parse(await ctx.req.formData());
    
    // Store as UTC using user's timezone
    const utcDate = parseUserTimezoneAsUTC(paymentDate, timezoneOffset);
    
    // Save to database as UTC
    await ExpenseService.create({
      ...otherData,
      payment: { date: utcDate, ...paymentData }
    });
  }
};
```

### Display Conversion

Dates are converted back to user timezone for display:

```typescript
// In getFormattedDate function
export const getFormattedDate = (date: Date | string) => {
  let displayDate: Date;
  
  // For client-side rendering, convert UTC to user timezone
  if (typeof window !== "undefined") {
    const userOffset = getUserTimezoneOffset();
    displayDate = convertUTCToUserTimezone(date, userOffset);
  } else {
    displayDate = new Date(date);
  }
  
  return Intl.DateTimeFormat("pt-BR").format(displayDate);
};
```

## Migration: Converting Existing Data

### Running the Migration

Existing data was stored with GMT-3 offset applied. To convert to proper UTC storage:

```bash
# Run the migration script
deno run --allow-all db/migrations/convert-gmt3-to-utc.ts
```

### What the Migration Does

1. **Finds all existing expenses and income records**
2. **Adds 3 hours (180 minutes) to all dates** to convert GMT-3 stored dates back to UTC
3. **Updates database keys** to reflect the new date indexing
4. **Preserves all other data** while fixing the timezone issue

```typescript
// Migration logic
const originalDate = new Date(expense.payment.date); // GMT-3 stored date
const utcDate = new Date(originalDate.getTime() + (180 * 60 * 1000)); // Add 3 hours
```

### Before and After Examples

```typescript
// Before migration (GMT-3 stored)
// User entered: "Aug 8, 2024 22:00" in São Paulo
// Database stored: "Aug 9, 2024 01:00" (with GMT-3 adjustment applied)

// After migration (UTC stored)  
// Database stores: "Aug 9, 2024 01:00" (as proper UTC)
// Display shows: "Aug 8, 2024 22:00" (converted back to user timezone)
```

## Data Flow

### Complete Timezone Flow

1. **User Input**: User selects "Aug 8, 2024 22:00" in their local timezone
2. **Frontend**: Detects timezone offset (e.g., -180 for GMT-3) and sends both to backend
3. **Backend**: Uses `parseUserTimezoneAsUTC("2024-08-08T22:00:00", -180)` to store as UTC
4. **Database**: Stores "2024-08-09T01:00:00.000Z" (proper UTC)
5. **Display**: Uses `convertUTCToUserTimezone()` to show "Aug 8, 2024 22:00" to user
const timezoneOffset = data.timezoneOffset ?? -180; // Default to GMT-3

const expense = {
  // ... other fields
  date: parseUserTimezoneAsUTC(data.paymentDate, timezoneOffset),
};
```

### Adding Timezone to User Preferences

Consider extending the User model to store timezone preferences:

```typescript
// In db/models/user.ts
export type User = {
  id: string;
  email: string;
  timezoneOffset?: number; // Optional timezone offset in minutes
  timezone?: string; // Optional timezone identifier
};

// Usage in API endpoints
const user = await UserService.getById(userId);
const userTimezoneOffset = user.timezoneOffset ?? -180; // Default to GMT-3
const date = parseUserTimezoneAsUTC(dateString, userTimezoneOffset);
```

## Timezone Offset Convention

The function follows JavaScript's `Date.getTimezoneOffset()` convention:
- **Negative values** = timezone behind UTC (e.g., GMT-3 = -180 minutes)
- **Positive values** = timezone ahead of UTC (e.g., GMT+5 = 300 minutes)
- **Zero** = UTC timezone

## Examples

```typescript
// GMT-3 (São Paulo, Brazil)
parseUserTimezoneAsUTC("2024-08-08T22:00:00", -180)
// Result: 2024-08-09T01:00:00.000Z

// GMT+5 (Pakistan, Uzbekistan)  
parseUserTimezoneAsUTC("2024-08-08T22:00:00", 300)
// Result: 2024-08-08T17:00:00.000Z

// UTC
parseUserTimezoneAsUTC("2024-08-08T22:00:00", 0)
// Result: 2024-08-08T22:00:00.000Z
```

## Backward Compatibility

The changes are fully backward compatible:
- Existing code without timezone parameters continues to work with GMT-3 default
- All existing API contracts remain unchanged
- No database migrations required

## Future Enhancements

1. **Automatic Timezone Detection**: Detect user timezone on first visit and store in user preferences
2. **Per-User Timezone Settings**: Allow users to set their preferred timezone in account settings
3. **Multiple Timezone Support**: Support for applications with users in different timezones
4. **Timezone Conversion Utilities**: Add functions to convert between timezones for display purposes