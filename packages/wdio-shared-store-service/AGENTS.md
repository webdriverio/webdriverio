# @wdio/shared-store-service

Read [packages/AGENTS.md](../AGENTS.md) first.

## Test ownership

The HTTP server is the store contract. Assert sets, gets, and resource-pool
changes with requests against `startServer()`. Do not export the in-memory
maps, and do not seed them from tests.

Keep these boundaries separate:

- `launcher.test.ts` stamps the port onto standard, W3C, and multi-remote capabilities, then closes the server
- `service.test.ts` reads that port in the worker and attaches `browser.sharedStore`
- `client.test.ts` covers request shape, the pre-init queue, and error wrapping
- `server.test.ts` covers store and resource-pool behavior on the wire
- `index.test.ts` covers the public service, launcher, and client re-exports

`validateBody` used to guard `POST /get` and `POST /set`. Those routes are gone.
Do not bring that middleware back for the current `/`, `/:key`, and `/pool` API.
