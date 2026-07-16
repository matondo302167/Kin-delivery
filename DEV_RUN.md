Run & dev instructions for Kolisa (development)

This file explains how to run the project locally and in environments like Replit. It documents the important environment variables and common commands.

1) Overview

- The project can run in two main modes:
  - Integrated server: `npm run dev` — this runs the Node/Express server which in development will also setup Vite as middleware and serve the client (recommended).
  - Separate client dev server: `npm run dev:client` — runs the Vite dev server only. Use this if you want to run client and server separately.

2) Important environment variables

- PORT: the port the backend server will listen on. Default: 5000
- HOST: the host address the server binds to. Default: in development it falls back to 127.0.0.1; in production to 0.0.0.0. You can override with HOST env var (e.g. HOST=0.0.0.0) — this is often required on platforms like Replit.
- BACKEND_HOST: used by the client dev server proxy (vite) to point to the backend host. Default: 127.0.0.1

3) Recommended local development (single process)

This is the easiest way — the Node server sets up Vite middleware and serves the client automatically.

```bash
# from the project root
# bind to all interfaces and use port 5000
HOST=0.0.0.0 PORT=5000 npm run dev
```

Open http://localhost:5000 in the browser.

4) Running client and server separately (optional)

If you prefer to run the client dev server separately (e.g. to use different ports):

```bash
# in one terminal start the backend on 5000
PORT=5000 HOST=127.0.0.1 npm run dev

# in another terminal start the client dev server with proxy configured
# to point to the backend
BACKEND_HOST=127.0.0.1 PORT=5000 npm run dev:client
```

Notes:
- The `vite.config.ts` proxy now resolves `/api` to `http://${process.env.BACKEND_HOST || "127.0.0.1"}:${process.env.PORT || 5000}`.
- If you see connection refused errors from Vite like `ECONNREFUSED 127.0.0.1:3001`, check that you don't have a stale fallback set to 3001 and that you started the backend on the same `PORT`.

5) Replit

- `.replit` contains `HOST = "0.0.0.0"` and `PORT = "5000"` by default. Replit will run `npm run dev` by default, which runs the integrated server and is the recommended flow.

6) Debugging tips

- To verify where the client is proxying requests, open the browser devtools Network tab and look at requests to `/api/...` — they should be forwarded to the backend address.
- Check server logs for the `serving on http://<host>:<port>` message printed by the server at startup.

7) Contact

If anything still fails, share the exact commands you ran and the console output and I will iterate further.

