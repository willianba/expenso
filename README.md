# Expenso

This is my first app built in deno/fresh. It's my attempt of creating the
expense tracker app I always wanted and never found.

## Usage

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then copy the `.env.example` to `.env` and fill the necessary values. You will
need a GitHub and a Google apps available for starting the app with
authentication.

You're good to start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.

## Inspecting the DB

Since I used [deno kv](https://deno.com/kv), I didn't find a proper way of
inspecting its data, even if I export it to a sqlite file with the
`DENO_KV_PATH` environment variable.

I found [kview](https://github.com/kitsonk/kview) which works better than
inspecting the sqlite file. So, if you intend to run the project locally and
want to inspect any db data, I highly encourage to use kview.
