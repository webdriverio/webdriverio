# @wdio/repl

In-process REPL used by standalone `browser.debug()` and extended by
`@wdio/local-runner`.

## Tests

`tests/repl.test.ts` is the only suite for this package. Assert observable
REPL behavior through `eval` and the options passed to `repl.start`:

- Static `browser`, `driver`, `$`, and `$$` results are not executed, including
  a command that only matches after `trim`.
- A command returns the vm result, a vm exception is the same error the
  callback receives, and a later command runs after success or failure.
- A second command is ignored while a promise is still running.
- Sync values, fulfilled promises, rejected promises (message, and no stack),
  and both timeout paths each call back once and then accept another command.
- `start()` stays pending until the `exit` listener runs, a second `start()`
  throws, and commands evaluate in the object passed to `start()`.
- A custom `eval` keeps the REPL server as `this` and receives that same object.

Do not stub private methods. Do not accept `expect.any(Object)` for the
context passed to `start()`. A test that stays green when that wrapper or the
`exit` listener is removed is not covering the contract.
