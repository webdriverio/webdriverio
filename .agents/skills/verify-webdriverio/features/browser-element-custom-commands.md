# Browser-runner custom element commands

Component specs can call custom commands registered by a Node-side `before` hook on the browser or on a single element. Drive the actual component runner to prove command registration, receiver scope and return/error delivery across the browser channel.

## Sub-features

- Browser registration uses `addCommand(name, fn)`; element registration uses `addCommand(name, fn, { attachToElement: true })`.
- Element commands receive the element ID, can call native element methods, and preserve arguments and asynchronous results.
- Same-name browser and element commands stay distinct; a missing element ID cannot fall back to browser scope.
- A rejected element command returns its original error message to the browser-side caller.

## How to get to it (user POV)

Register a command in the testrunner's Node-side `before` hook, then call it on an element in a browser-runner spec. The maintained example is `e2e/browser-runner/customCommands.conf.js` and its `nodeElementCommands.test.js` spec.

## Driving it with the WebdriverIO harness

After `.agents/resume` prints `Ready.`, run `pnpm --dir e2e run test:browser:customCommands` from the repo root. Save the command, output and result under `.agents/verify-artifacts/browser-element-custom-commands/`.

Require exit 0, all seven spec tests passing, and the standard coverage check. This script is also included by the normal `pnpm run test:component` chain.

## Gotchas

- This is a real-browser component proof, not a mock-driver smoke suite. It needs the browser/driver configured by the normal component config.
- On macOS, a local run with `CI` unset uses Chrome; the existing CI configuration may select Safari.
- Test data consists only of two elements rendered in the owned test page. No external service, account or network mock is required.
