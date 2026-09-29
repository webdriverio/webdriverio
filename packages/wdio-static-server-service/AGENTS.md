# @wdio/static-server-service

Launcher-only service. `onPrepare` serves folders and has no worker hooks.

## Guardrails

- Do not add a default export. `initializeLauncherService` treats a default
  function as a worker service and would load this package in every worker.
  `@wdio/firefox-profile-service` is the same shape.
- Launcher tests own `onPrepare`: no server without `folders`, folder mounts,
  listen port, the access-log stream, and middleware. Assert the handler
  `express.static` returns. `undefined` is only the automock default and does
  not prove the mount.
- Option types are covered in `tests/typings/webdriverio/config.ts`.

## Commands

```sh
pnpm run test:package wdio-static-server-service
```
