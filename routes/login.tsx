import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";

export default defineRoute<State>((_req, _ctx) => {
  return (
    <div className="hero min-h-full">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <div class="flex flex-col m-4">
            <div className="w-60">
              <a
                class="btn btn-primary w-full"
                href="/api/auth/login/github?success_url=/app"
              >
                GitHub
              </a>
              <a
                class="btn btn-primary w-full mt-2"
                href="/api/auth/login/google?success_url=/app"
              >
                Google
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
