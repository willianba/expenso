import { assertEquals, assertExists } from "@std/assert";
import UserService, { Keys, User } from "@/db/models/user.ts";
import { kv } from "@/db/kv.ts";

const SESSION_TTL = 90 * 24 * 60 * 60 * 1000;

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

Deno.test(
  "Race Condition Timing Test - Issue #17 Demonstration",
  async (t) => {
    const testEmail = `timing-test-${crypto.randomUUID()}@example.com`;
    const sessionId = crypto.randomUUID();

    await t.step("cleanup before tests", async () => {
      await cleanup(testEmail, sessionId);
    });

    await t.step(
      "NEGATIVE: immediate eventual consistency read may fail after atomic write",
      async () => {
        // Arrange: Create a user
        const user = await UserService.create({ email: testEmail });

        // Act: Simulate exact sequence from password.ts
        // 1. Write session atomically
        const sessionKey = [Keys.USERS_SESSION, sessionId];
        const sessionRes = await kv
          .atomic()
          .check({ key: sessionKey, versionstamp: null })
          .set(sessionKey, user, { expireIn: SESSION_TTL })
          .commit();

        assertEquals(sessionRes.ok, true);

        // 2. Immediately read with eventual consistency (this is what happens first in getBySessionId)
        const eventualUser = await kv.get<User>(sessionKey, {
          consistency: "eventual",
        });

        // This demonstrates the race condition:
        // - In production/deployed environments, eventual consistency might not have caught up
        // - In local/test environments, it often works immediately due to single-node setup
        console.log(
          `Immediate eventual read after atomic write: ${
            eventualUser.value ? "SUCCESS" : "FAILED (race condition)"
          }`,
        );

        // The current code has a fallback to strong consistency, which masks the issue:
        if (eventualUser.value === null) {
          const strongUser = await kv.get<User>(sessionKey);
          assertExists(
            strongUser.value,
            "Fallback to strong consistency should work",
          );
        }

        // However, the issue is that we shouldn't need this fallback for FRESH sessions
        // The fix should ensure strong consistency for newly created sessions
      },
    );

    await t.step(
      "POSITIVE: verify current UserService.getBySessionId has fallback",
      async () => {
        // Act: Use the actual UserService method
        const user = await UserService.getBySessionId(sessionId);

        // Assert: The fallback mechanism in getBySessionId should handle this
        assertExists(
          user,
          "UserService.getBySessionId should find the session (via fallback)",
        );

        // Note: This test passes because getBySessionId has a fallback to strong consistency
        // However, for optimal performance and reliability, we should:
        // 1. Verify the session is readable with strong consistency BEFORE redirecting
        // 2. Or use a method that guarantees immediate availability after write
      },
    );

    await t.step("cleanup after tests", async () => {
      await cleanup(testEmail, sessionId);
    });
  },
);

Deno.test("Proposed Fix Verification - Issue #17", async (t) => {
  const testEmail = `fix-test-${crypto.randomUUID()}@example.com`;
  const sessionId = crypto.randomUUID();

  await t.step("cleanup before tests", async () => {
    await cleanup(testEmail, sessionId);
  });

  await t.step(
    "POSITIVE: verify session exists with strong consistency before redirect",
    async () => {
      // Arrange: Create user
      const user = await UserService.create({ email: testEmail });

      // Act: Write session and immediately verify with strong consistency
      const sessionKey = [Keys.USERS_SESSION, sessionId];
      const sessionRes = await kv
        .atomic()
        .check({ key: sessionKey, versionstamp: null })
        .set(sessionKey, user, { expireIn: SESSION_TTL })
        .commit();

      assertEquals(sessionRes.ok, true);

      // This is what the fix should do: verify with STRONG consistency
      // BEFORE sending the redirect response
      const verifyUser = await kv.get<User>(sessionKey, {
        consistency: "strong",
      });

      // Assert: Strong consistency read should always work immediately
      assertExists(
        verifyUser.value,
        "Strong consistency verification should confirm session exists",
      );
      assertEquals(verifyUser.value.id, user.id);

      // Now it's safe to redirect, because we KNOW the session is available
      // for the middleware to read (even with eventual consistency)
    },
  );

  await t.step(
    "POSITIVE: after strong consistency verification, eventual consistency should work",
    async () => {
      // After the strong consistency read in the previous step,
      // even eventual consistency should work
      const sessionKey = [Keys.USERS_SESSION, sessionId];
      const eventualUser = await kv.get<User>(sessionKey, {
        consistency: "eventual",
      });

      assertExists(
        eventualUser.value,
        "After strong consistency verification, eventual should work",
      );
    },
  );

  await t.step("cleanup after tests", async () => {
    await cleanup(testEmail, sessionId);
  });
});
