# create-wdio

Scaffolds a WebdriverIO project (`npm create wdio` / `npm init wdio`) and the
`wdio config` / `wdio install` commands re-exported to `@wdio/cli`.

## Commands

```sh
pnpm run dev create-wdio
pnpm run test:package create-wdio
```

## Tests

Unit tests import `src/` directly. They do not prove a generated project runs;
`pnpm run test:e2e:create-wdio` does. It packs the build, runs it with
`npm exec` (as `npm init wdio` does) and `--yes`, then runs the generated test
in one Chrome window. @wdio/cli and the other packages come from npm. CI runs
it on Ubuntu, Windows and macOS (`.github/workflows/test-create-wdio.yml`).

- `answers.generateTestFiles` is enforced in `createWDIOConfig` before it calls
  `generateTestFiles`. The generator itself always renders the selected
  framework templates. An empty directory listing does not prove generation
  was skipped.
- `getPackageVersion` reads this package's `package.json` and falls back to
  `'unknown'`. Assert the version string. `expect.any(String)` also passes on
  the fallback, which is what a `fs/promises` mock without `readFile` produces.
- `createWDIOScript` shells out through `runProgram`. The call is owned by the
  `runConfigCommand` test. Do not assert `child_process.spawn` for it.
- Lit component templates ignore `installTestingLibrary`. A lit case named for
  the absence of Testing Library must pass `installTestingLibrary: false`.
- Declining the missing-config prompt exits the process. Mock `process.exit`
  so that it throws; a non-throwing mock falls through into the wizard.

## Wizard flags

`src/answerFlags.ts` maps a command line flag to every `QUESTIONNAIRE`
question. `npm init wdio` (commander) and `wdio config` (yargs) both read it,
and `npm init wdio` forwards the flags to `wdio config`. When you add or
rename a question or a choice, update its entry and the flag table in
`website/docs/GettingStarted.md`. A flag for a question whose `when` is false,
or a value outside its `choices`, is rejected after the answers are collected
(`assertAnswerFlagsApply`).
