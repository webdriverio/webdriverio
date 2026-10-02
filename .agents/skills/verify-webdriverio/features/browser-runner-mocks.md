# Browser-runner network mocks

Component specs execute `browser.mock()` inside a real browser. Drive this path to verify browser-side response serialization, interception, and cleanup.

## Sub-features

- `browser-runner-mocks` replaces API responses using absolute and host-less single-star patterns, handles binary data (including iframe-created buffers with a throwing species getter), redirects an image, and restores the original image request.

## How to get to it (user POV)

Run the `test:browser:misc` script in `e2e/package.json`. Its spec is `e2e/browser-runner/mock.test.ts`.

## Driving it with the WebdriverIO harness

After `.agents/resume` prints `Ready.`, run `CI=1 pnpm --dir e2e run test:browser:misc` from the repo root. Save `command.txt`, `output.txt`, and `result.txt` under `.agents/verify-artifacts/browser-runner-mocks/`.

Require exit 0 and the spec reporter's five passing tests: API requests, binary responses without a global Buffer, binary responses from an iframe, image redirection, and the image after restoring its mock. On macOS, the mock spec uses Chrome even under CI; the other component specs retain their Safari configuration.

## Gotchas

- The suite requires Chrome/ChromeDriver. Image requests use local SVG fixtures served by Vite; API responses are supplied by the mock.
- Prefer a fixed API host to limit the intercept. The API test also verifies a host-less single-star pattern. Avoid consecutive wildcards before fixed text, which can stall URLPattern matching.
- A skipped process with exit 0 is not proof. Require all five tests in the output.
- Run one real-browser suite at a time; this is not a mock-driver smoke test.
