# Timezone Handling Implementation

The timezone handling has been updated to be more future-proof and flexible. Instead of having a hardcoded GMT-3 offset, the system now supports dynamic timezone detection and configuration.

## Key Changes

### 1. Enhanced `parseUserTimezoneAsUTC` Function

The function now accepts an optional timezone offset parameter:

```typescript
// Before (hardcoded GMT-3)
const date = parseUserTimezoneAsUTC("2024-08-08T22:00:00");

// After (flexible timezone support)
const date = parseUserTimezoneAsUTC("2024-08-08T22:00:00", userTimezoneOffset);

// Or use default GMT-3 for backward compatibility
const date = parseUserTimezoneAsUTC("2024-08-08T22:00:00"); // Still defaults to GMT-3
```

### 2. New Helper Functions

```typescript
// Get user's timezone offset in minutes (browser-side)
const offset = getUserTimezoneOffset(); // Returns offset like -180 for GMT-3

// Get user's timezone identifier (browser-side) 
const timezone = getUserTimezone(); // Returns "America/Sao_Paulo"
```

## Implementation Examples

### Client-Side Timezone Detection

Add this to your frontend forms to detect the user's timezone:

```javascript
// In your expense/income form component
const userTimezoneOffset = new Date().getTimezoneOffset();
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Send this data along with the form submission
const formData = {
  paymentDate: "2024-08-08T22:00:00",
  timezoneOffset: userTimezoneOffset, // e.g., -180 for GMT-3
  timezone: userTimezone, // e.g., "America/Sao_Paulo"
  // ... other form fields
};
```

### Server-Side Usage in API Endpoints

Update your API endpoints to use the timezone information:

```typescript
// In routes/api/expenses/[id].ts
import { parseUserTimezoneAsUTC } from "@/utils/date.ts";

// Extract timezone from request (could come from headers, body, or user settings)
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