# @wdio/config

Shared package rules: [packages/AGENTS.md](../AGENTS.md). Rules below come from
mistakes found while auditing this package's tests.

## Test ownership

- `validateConfig`, `applyHeadlessFlag`, `removeLineNumbers`, `validObjectOrArray`,
  and `isCloudCapability` are owned by `tests/validateConfig.test.ts` and
  `tests/utils.test.ts`. Replay one in `ConfigParser` only when the parser adds
  a distinct failure, such as wiring a CLI flag through to capabilities.
- Spec, suite, exclude, repeat, and shard behavior is owned by
  `tests/node/configparser.test.ts`.
- `FileSystemPathService` filesystem behavior is owned by
  `tests/node/FileSystemPathService.test.ts`.

## Assertion rules

- `await` `ConfigParser.initialize(...)` before `getSpecs()`. An un-awaited
  call still sees the default empty spec list, so an exclude assertion of
  length 0 passes without excluding anything.
- An unsupported-extension check must assert that the resolved file is absent
  and that a supported file from the same glob is present. Asserting that the
  glob pattern string is absent passes even when the file is returned.
- Cucumber specs that include a line suffix must keep that original spec on
  `cucumberFeaturesWithLineNumbers`. Checking only the stripped path does not
  guard that list.
- `--repeat` order has one owner: the test that repeats two specs and checks
  their order. A second test that repeats a single spec does not add a failure
  mode.
- Snapshots for `tests/node/configparser.test.ts` live in
  `tests/node/__snapshots__/`.
- Add a `PathService` call spy only when a test asserts that call.
