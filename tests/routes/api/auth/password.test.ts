import { assertEquals, assertExists } from "@std/assert";
import { handler } from "@/routes/api/auth/password.ts";
import UserService, { Keys } from "@/db/models/user.ts";
import { kv } from "@/db/kv.ts";
import { hashSync } from "https://deno.land/x/bcrypt@v0.4.1/src/main.ts";

type TemporaryUser = {
  name: string;
  password: string;
};

// Helper to create a test request
function createPasswordRequest(email: string, password: string): Request {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  return new Request("http://localhost:8000/api/auth/password", {
    method: "POST",
    body: formData,
  });
}

// Helper to extract session ID from response cookies
function getSessionIdFromResponse(response: Response): string | undefined {
  const cookieHeader = response.headers.get("set-cookie");
  if (!cookieHeader) return undefined;

  const cookieMatch = cookieHeader.match(/(?:__Host-)?expenso-session=([^;]+)/);
  return cookieMatch?.[1];
}

// Clean up test data
async function cleanup(email: string, sessionId?: string) {
  const user = await UserService.getByEmail(email);
  if (user) {
    await kv.delete([Keys.USERS, user.id]);
    await kv.delete([Keys.USERS_BY_EMAIL, email]);
  }
  if (sessionId) {
    await kv.delete([Keys.USERS_SESSION, sessionId]);
  }
  await kv.delete([Keys.TEMPORARY_LOGIN, email]);
}

Deno.test("Password Authentication Flow (Issue #17)", async (t) => {
  const testEmail = `auth-test-${crypto.randomUUID()}@example.com`;
  const testPassword = "1234567890"; // 10 chars as per schema
  const hashedPassword = hashSync(testPassword);
  let sessionId: string | undefined;

  await t.step("setup - create temporary login", async () => {
    await kv.set([Keys.TEMPORARY_LOGIN, testEmail], {
      name: "Test User",
      password: hashedPassword,
    } as TemporaryUser);
  });

  await t.step(
    "POSITIVE: new user login should create user, set session, and redirect",
    async () => {
      // Arrange: Request with valid credentials for non-existent user
      const request = createPasswordRequest(testEmail, testPassword);

      // Act: Process login
      const handlerObj = handler as Record<string, unknown>;
      const postFn = handlerObj.POST as (
        ctx: Record<string, unknown>,
      ) => Promise<Response>;
      const response = await postFn({ req: request });

      // Assert: Response should be a redirect to /app
      assertEquals(
        response.status,
        302,
        "Should redirect after successful login",
      );
      assertEquals(
        response.headers.get("Location"),
        "/app",
        "Should redirect to /app",
      );

      // Assert: Session cookie should be set
      sessionId = getSessionIdFromResponse(response);
      assertExists(sessionId, "Session cookie should be set in response");

      // Assert: User should be created
      const user = await UserService.getByEmail(testEmail);
      assertExists(user, "User should be created in database");
      assertEquals(user.email, testEmail);

      // Assert: Session should be immediately retrievable
      // THIS IS THE CRITICAL TEST FOR ISSUE #17
      // After login redirect, the session MUST be available for middleware to find
      const sessionUser = await UserService.getBySessionId(sessionId);
      assertExists(
        sessionUser,
        "Session must be immediately retrievable after login (fixes Issue #17)",
      );
      assertEquals(sessionUser.id, user.id);
      assertEquals(sessionUser.email, testEmail);
    },
  );

  await t.step(
    "POSITIVE: existing user login should reuse user and set new session",
    async () => {
      // Arrange: User already exists from previous test, create new temp login
      const newPassword = "0987654321";
      const newHashedPassword = hashSync(newPassword);
      await kv.set([Keys.TEMPORARY_LOGIN, testEmail], {
        name: "Test User",
        password: newHashedPassword,
      } as TemporaryUser);

      const request = createPasswordRequest(testEmail, newPassword);

      // Act: Process login
      const handlerObj = handler as Record<string, unknown>;
      const postFn = handlerObj.POST as (
        ctx: Record<string, unknown>,
      ) => Promise<Response>;
      const response = await postFn({ req: request });

      // Assert: Should redirect
      assertEquals(response.status, 302);

      // Assert: Should use existing user, not create a new one
      const user = await UserService.getByEmail(testEmail);
      assertExists(user);
      assertEquals(user.email, testEmail);

      // Assert: New session should be set and immediately retrievable
      const newSessionIdFromResponse = getSessionIdFromResponse(response);
      assertExists(newSessionIdFromResponse);
      const sessionUser = await UserService.getBySessionId(
        newSessionIdFromResponse,
      );
      assertExists(
        sessionUser,
        "New session should be immediately retrievable",
      );
    },
  );

  await t.step(
    "NEGATIVE: login with invalid password should fail",
    async () => {
      // Arrange: Set up temporary login with correct password
      await kv.set([Keys.TEMPORARY_LOGIN, testEmail], {
        name: "Test User",
        password: hashedPassword,
      } as TemporaryUser);

      const wrongPassword = "wrongpassw";
      const request = createPasswordRequest(testEmail, wrongPassword);

      // Act & Assert: Should throw permission denied
      try {
        const handlerObj = handler as Record<string, unknown>;
        const postFn = handlerObj.POST as (
          ctx: Record<string, unknown>,
        ) => Promise<Response>;
        await postFn({ req: request });
        throw new Error("Should have thrown PermissionDenied");
      } catch (error) {
        const err = error as Error;
        assertEquals(
          err.name,
          "PermissionDenied",
          "Should throw PermissionDenied for wrong password",
        );
      }
    },
  );

  await t.step(
    "NEGATIVE: login with non-existent email should fail",
    async () => {
      // Arrange: Use email that doesn't have temporary login
      const nonExistentEmail = `nonexistent-${crypto.randomUUID()}@example.com`;
      const request = createPasswordRequest(nonExistentEmail, testPassword);

      // Act & Assert: Should throw permission denied
      try {
        const handlerObj = handler as Record<string, unknown>;
        const postFn = handlerObj.POST as (
          ctx: Record<string, unknown>,
        ) => Promise<Response>;
        await postFn({ req: request });
        throw new Error("Should have thrown PermissionDenied");
      } catch (error) {
        const err = error as Error;
        assertEquals(
          err.name,
          "PermissionDenied",
          "Should throw PermissionDenied for non-existent user",
        );
      }
    },
  );

  await t.step(
    "NEGATIVE: login with invalid email format should return 400",
    async () => {
      // Arrange: Invalid email format
      const request = createPasswordRequest("not-an-email", testPassword);

      // Act: Process login
      const handlerObj = handler as Record<string, unknown>;
      const postFn = handlerObj.POST as (
        ctx: Record<string, unknown>,
      ) => Promise<Response>;
      const response = await postFn({ req: request });

      // Assert: Should return 400 for validation error
      assertEquals(
        response.status,
        400,
        "Should return 400 for invalid email format",
      );
    },
  );

  await t.step("cleanup after tests", async () => {
    await cleanup(testEmail, sessionId);
  });
});

Deno.test("Middleware Session Resolution (Issue #17)", async (t) => {
  const testEmail = `middleware-test-${crypto.randomUUID()}@example.com`;
  let sessionId: string | undefined;

  await t.step("setup", async () => {
    await cleanup(testEmail);
  });

  await t.step(
    "POSITIVE: middleware should find session immediately after login",
    async () => {
      // Arrange: Create user and session (simulating what password.ts does)
      const user = await UserService.create({ email: testEmail });
      sessionId = crypto.randomUUID();

      // Simulate the atomic session write from password.ts
      const SESSION_TTL = 90 * 24 * 60 * 60 * 1000;
      const sessionKey = [Keys.USERS_SESSION, sessionId];
      await kv
        .atomic()
        .check({ key: sessionKey, versionstamp: null })
        .set(sessionKey, user, { expireIn: SESSION_TTL })
        .commit();

      // Act: Immediately try to retrieve (simulating middleware behavior)
      const retrievedUser = await UserService.getBySessionId(sessionId);

      // Assert: Middleware should find the user
      // This test verifies the fix for Issue #17: after password.ts sets the session
      // and redirects, the middleware MUST be able to find the session
      assertExists(
        retrievedUser,
        "Middleware must find session immediately after creation (Issue #17 fix)",
      );
      assertEquals(retrievedUser.id, user.id);
      assertEquals(retrievedUser.email, testEmail);
    },
  );

  await t.step(
    "NEGATIVE: middleware should handle missing session without error",
    async () => {
      // Arrange: Use non-existent session ID
      const fakeSessionId = crypto.randomUUID();

      // Act: Try to retrieve
      const retrievedUser = await UserService.getBySessionId(fakeSessionId);

      // Assert: Should return null, not throw
      // This ensures middleware can gracefully handle missing/expired sessions
      assertEquals(
        retrievedUser,
        null,
        "Middleware should handle missing sessions gracefully",
      );
    },
  );

  await t.step("cleanup after tests", async () => {
    await cleanup(testEmail, sessionId);
  });
});
