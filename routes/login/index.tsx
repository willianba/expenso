import { define } from "@/utils/state.ts";

export default define.page(() => {
  return (
    <div class="hero min-h-full bg-base-200">
      <div class="hero-content flex-col lg:flex-row-reverse">
        <div class="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <form class="card-body" method="POST" action="/api/auth/login">
            <fieldset class="fieldset">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                class="input"
                required
              />
            </fieldset>
            <fieldset class="fieldset mt-6">
              <button type="submit" class="btn btn-primary">
                Get password
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
});
