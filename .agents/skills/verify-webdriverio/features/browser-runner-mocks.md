# Browser-runner network mocks

Component specs execute `browser.mock()` inside a real browser. Drive this path to verify browser-side response serialization, interception, and cleanup.

## Sub-features

- `browser-runner-mocks` replaces API responses with JSON and text, redirects an image, and restores the original image request.

## How to get to it (user POV)

Run the `test:browser:misc` script in `e2e/package.json`. Its spec is `e2e/browser-runner/mock.test.ts`.

## Driving it with the WebdriverIO harness

After `.agents/resume` prints `Ready.`, run `CI=1 pnpm --dir e2e run test:browser:misc` from the repo root. Save `command.txt`, `output.txt`, and `result.txt` under `.agents/verify-artifacts/browser-runner-mocks/`.

Require exit 0 and the spec reporter's three passing assertions: API requests, image redirection, and the image after restoring its mock. On macOS, the mock spec uses Chrome even under CI; the other component specs retain their Safari configuration.

## Gotchas

- The suite requires Chrome/ChromeDriver and access to `api.webdriver.io` and `placehold.co`.
- Match the API host as well as its wildcard path. A catch-all BiDi intercept can block the browser runner's own Vite or driver traffic.
- A skipped process with exit 0 is not proof. Require all three assertions in the output.
- Run one real-browser suite at a time; this is not a mock-driver smoke test.
