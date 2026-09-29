# @wdio/logger

`src/utils.ts` owns masking-pattern parsing and replacement.
`src/index.ts` owns the Node logger: levels, the log file, console formatting, and `progress`.
`src/browser.ts` is the browser shim. Do not assert Node file or masking behavior there.

## Tests

- Assert logger output (file writes and console arguments). Do not spy on `Set.prototype` or other internals of the log cache.
- Apply every matcher. `expect.stringMatching(...)` by itself never fails.
- A trailing-newline test must use a pattern that consumes the newline. `[^ ]*` does not, so it stays green if newline restoration is removed.
- `mask` receives a string from the logger. Do not keep a non-string branch alive for tests.
- Unsafe patterns rejected by `safe-regex2` need a parser test. Safe examples do not reach that gate.
- Ordinary lines go to the log file only. Integration plugin-not-found errors are the exception written to both the file and the terminal.
