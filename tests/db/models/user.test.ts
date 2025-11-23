import { assertEquals, assertExists } from "@std/assert";
import UserService, { Keys, User } from "@/db/models/user.ts";
import { kv } from "@/db/kv.ts";

// Clean up test data after each test
async function cleanup(email: string, sessionId?: string) {
  const user = await UserService.getByEmail(email);
  if (user) {
    await kv.delete([Keys.USERS, user.id]);
    await kv.delete([Keys.USERS_BY_EMAIL, email]);
  }
  if (sessionId) {
    await kv.delete([Keys.USERS_SESSION, sessionId]);
  }
}

Deno.test("UserService - Session Management", async (t) => {
  const testEmail = `test-${crypto.randomUUID()}@example.com`;
  const sessionId = crypto.randomUUID();

  await t.step("cleanup before tests", async () => {
    await cleanup(testEmail, sessionId);
  });

  await t.step(
    "POSITIVE: should immediately retrieve session after creation with strong consistency",
    async () => {
      // Arrange: Create a user
      const user = await UserService.create({ email: testEmail });
      assertExists(user);
      assertEquals(user.email, testEmail);

      // Act: Set session and immediately try to retrieve it
      await UserService.setSession(user, sessionId);

      // Assert: Session should be immediately available
      // This test verifies that after setting a session, we can immediately read it
      // which is critical for the first-login redirect to work properly
      const retrievedUser = await UserService.getBySessionId(sessionId);
      assertExists(retrievedUser, "Session should be immediately retrievable");
      assertEquals(retrievedUser.id, user.id);
      assertEquals(retrievedUser.email, user.email);
    },
  );

  await t.step(
    "NEGATIVE: should handle non-existent session gracefully",
    async () => {
      // Arrange: Use a session ID that doesn't exist
      const nonExistentSessionId = crypto.randomUUID();

      // Act: Try to retrieve non-existent session
      const result = await UserService.getBySessionId(nonExistentSessionId);

      // Assert: Should return null, not throw an error
      // This ensures the middleware can handle missing sessions gracefully
      assertEquals(
        result,
        null,
        "Non-existent session should return null, not throw",
      );
    },
  );

  await t.step(
    "POSITIVE: getBySessionId should work with eventual consistency for existing sessions",
    async () => {
      // Arrange: Session already exists from previous test
      // Wait a bit to ensure eventual consistency has caught up
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act: Retrieve with eventual consistency (should work for older sessions)
      const retrievedUser = await UserService.getBySessionId(sessionId);

      // Assert: Should still retrieve the session
      // This verifies backward compatibility with the eventual consistency check
      assertExists(
        retrievedUser,
        "Existing session should be retrievable with eventual consistency",
      );
    },
  );

  await t.step(
    "NEGATIVE: should not create duplicate sessions",
    async () => {
      // Arrange: Get the user
      const user = await UserService.getByEmail(testEmail);
      assertExists(user);

      // Act: Try to set session with the same ID again
      await UserService.setSession(user, sessionId);

      // Assert: Should still have only one session (verified by retrieval)
      const retrievedUser = await UserService.getBySessionId(sessionId);
      assertExists(retrievedUser);
      assertEquals(retrievedUser.id, user.id);
    },
  );

  await t.step("cleanup after tests", async () => {
    await cleanup(testEmail, sessionId);
  });
});

Deno.test(
  "UserService - Race Condition Reproduction (Issue #17)",
  async (t) => {
    const testEmail = `race-test-${crypto.randomUUID()}@example.com`;
    const sessionId = crypto.randomUUID();

    await t.step("cleanup before tests", async () => {
      await cleanup(testEmail, sessionId);
    });

    await t.step(
      "NEGATIVE: demonstrates the race condition with eventual consistency",
      async () => {
        // Arrange: Create a user
        const user = await UserService.create({ email: testEmail });

        // Act: Set session using atomic write
        const sessionKey = [Keys.USERS_SESSION, sessionId];
        const SESSION_TTL = 90 * 24 * 60 * 60 * 1000;
        const sessionRes = await kv
          .atomic()
          .check({ key: sessionKey, versionstamp: null })
          .set(sessionKey, user, { expireIn: SESSION_TTL })
          .commit();

        assertEquals(sessionRes.ok, true, "Session write should succeed");

        // Act: Immediately try to read with eventual consistency (simulates the bug)
        const eventualUser = await kv.get<User>(sessionKey, {
          consistency: "eventual",
        });

        // Assert: This test documents the race condition
        // In the actual bug, eventualUser.value might be null immediately after write
        // causing the middleware to fail to find the user on first redirect
        // Note: This test may pass or fail depending on timing, which demonstrates
        // the non-deterministic nature of the race condition
        console.log(
          `Eventual consistency result: ${
            eventualUser.value ? "found" : "not found"
          } (race condition may occur)`,
        );

        // The fix should ensure we don't rely on eventual consistency for fresh sessions
      },
    );

    await t.step(
      "POSITIVE: strong consistency read always works immediately after write",
      async () => {
        // Arrange: Session was just written in previous test
        const sessionKey = [Keys.USERS_SESSION, sessionId];

        // Act: Read with strong consistency
        const strongUser = await kv.get<User>(sessionKey);

        // Assert: Strong consistency should always find the just-written session
        // This is the behavior we need for the fix
        assertExists(
          strongUser.value,
          "Strong consistency read should always work after write",
        );
        assertEquals(strongUser.value.email, testEmail);
      },
    );

    await t.step("cleanup after tests", async () => {
      await cleanup(testEmail, sessionId);
    });
  },
);
