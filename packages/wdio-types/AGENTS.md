# @wdio/types

Shared TypeScript types. Runtime code is the browser-channel helpers in `src/BrowserChannel.ts`.

## Tests

- `tests/browserChannel.test.ts` owns on-wire `MESSAGE_TYPES` numbers, payload validation, and `routeBrowserToRunnerMessage`.
- `tests/browserChannel.test-d.ts` owns assignability and the historical `Workers.SocketMessage*` aliases.

`routeBrowserToRunnerMessage` is the only request, event, and browser-state classifier. `@wdio/browser-runner`'s communicator owns delivery. Do not add a second request predicate unless a production caller needs that type guard.
