# @wdio/testingbot-service

Worker hooks update the TestingBot job. The launcher starts TestingBot Tunnel.
Unit tests live in `tests/` and import `src/`.

## Tests

- Assert annotations on `executeScript` for the browser, or on each multi-remote
  instance. Do not stub `setAnnotation`. That skips the script the service sends.
- A generated tunnel id is one value, shared by `tb:options['tunnel-identifier']`
  and the options passed to the tunnel. A present key is not that contract.
- The job request (URL, body, and auth) belongs on the `updateJob` fetch. A
  helper test stays green when `updateJob` stops calling the helper.
- An `onReload` skip must spy the same service instance that receives the hook.
