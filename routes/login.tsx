import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";

export default defineRoute<State>((_req, _ctx) => {
  return (
    <div className="hero min-h-full bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <form className="card-body" method="POST" action="/api/users/login">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Name"
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control mt-6">
              <button className="btn btn-primary">
                Get password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});
