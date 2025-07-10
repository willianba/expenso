import { define } from "@/utils/state.ts";

export default define.page(({ url }) => {
  return (
    <div className="hero min-h-full bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <form
            className="card-body"
            method="POST"
            action="/api/auth/password"
          >
            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="input"
                value={url.searchParams.get("email") || ""}
                required
              />
            </fieldset>
            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                minLength={10}
                maxLength={10}
                className="input"
                value={url.searchParams.get("password") || ""}
                required
              />
            </fieldset>
            <fieldset className="fieldset mt-6">
              <button type="submit" className="btn btn-md btn-primary">
                Log in
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
});
