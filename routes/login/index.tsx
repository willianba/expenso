import { define } from "@/utils/state.ts";

export default define.page(() => {
  return (
    <div className="hero min-h-full bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <form className="card-body" method="POST" action="/api/auth/login">
            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="input"
                required
              />
            </fieldset>
            <fieldset className="fieldset mt-6">
              <button type="submit" className="btn btn-primary">
                Get password
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
});
