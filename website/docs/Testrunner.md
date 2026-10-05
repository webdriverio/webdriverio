---
id: testrunner
title: Testrunner
description: "Install the WDIO testrunner from @wdio/cli and use its config, run, install, repl and session commands to set up and run test suites."
---

The WebdriverIO testrunner runs your test suite from a configuration file. It starts one worker per capability, wires up your framework, services and reporters, and runs specs in parallel. Use it for every test project; use the [standalone mode](/docs/setuptypes) only when you embed WebdriverIO into your own tooling.

The testrunner ships in the `@wdio/cli` package:

```sh npm2yarn
npm install --save-dev @wdio/cli
```

`npx wdio` runs the same CLI when `@wdio/cli` is not installed yet. npm installs the unscoped [`wdio`](https://www.npmjs.com/package/wdio) package, and that package starts `@wdio/cli`.

To set up a new project, run the configuration wizard. It asks a few questions, installs the packages and writes a `wdio.conf.ts`:

```sh
npx wdio config
```

Then run your tests:

```sh
npx wdio run wdio.conf.ts
```

`run` is the default command, so `npx wdio wdio.conf.ts` does the same. In your specs, import the session from `@wdio/globals`:

```ts title="test/specs/example.e2e.ts"
import { browser, $, expect } from '@wdio/globals'

describe('webdriver.io', () => {
    it('has a title', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle(expect.stringContaining('WebdriverIO'))
    })
})
```

See [Configuration File](/docs/configurationfile) for every option of `wdio.conf.ts`.

## Commands

```sh
$ npx wdio --help

wdio [command]

Commands:
  wdio config                           Initialize WebdriverIO and setup
                                        configuration in your current project.
  wdio install <type> <name>            Add a `reporter`, `service`, or
                                        `framework` to your WebdriverIO project.
  wdio repl [option] [capabilities]     Run WebDriver session in command line
  wdio run <configPath>                 Run your WDIO configuration file to
                                        initialize your tests. (default)
  wdio session [action..]               Drive a browser, mobile app or desktop
                                        app from the shell

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

Every command prints its own options with `--help`, e.g. `npx wdio run --help`.

### `wdio config`

The `config` command runs the configuration wizard and creates a `wdio.conf.ts` (or `wdio.conf.js`) based on your answers.

```sh
npx wdio config
```

Pass `--yes` to use the defaults (Mocha, Chrome and page objects) without prompting. Every wizard question also has a flag, so you can answer some or all of them on the command line:

```sh
npx wdio config --yes --framework cucumber --no-typescript --reporters spec,junit
```

Options:

```
-y, --yes      will fill in all config defaults without prompting
                                                      [boolean] [default: false]
-t, --npmTag   define NPM tag to use for WebdriverIO related packages
                                                    [string] [default: "latest"]
    --help     Show help, including a flag for every wizard question   [boolean]
```

The wizard installs packages with the package manager that runs it: `pnpm wdio config` uses pnpm, `yarn wdio config` uses Yarn, and `npx` uses npm.

`npx wdio config --help` lists the wizard flags and the values they accept. A flag for a question the wizard does not ask for your setup is an error, and so is a value it does not offer. See [Answer the wizard with flags](/docs/gettingstarted#answer-the-wizard-with-flags) for examples.

### `wdio run`

> This is the default command to run your configuration.

The `run` command loads your configuration file and runs your tests. Command line options override the matching options in the configuration file.

```sh
npx wdio run wdio.conf.ts --spec test/specs/login.e2e.ts
```

Options:

```
    --watch            Run WebdriverIO in watch mode                   [boolean]
-h, --hostname         automation driver host address                   [string]
-p, --port             automation driver port                           [number]
    --path             path to WebDriver endpoints (default "/")        [string]
-u, --user             username if using a cloud service as automation backend
                                                                        [string]
-k, --key              corresponding access key to the user             [string]
-l, --logLevel         level of logging verbosity
                [choices: "trace", "debug", "info", "warn", "error", "silent"]
    --bail             stop test runner after specific amount of tests have
                       failed                                           [number]
    --baseUrl          shorten url command calls by setting a base url  [string]
-w, --waitforTimeout   timeout for all waitForXXX commands              [number]
-s, --updateSnapshots  update DOM, image or test snapshots              [string]
-f, --framework        defines the framework (Mocha, Jasmine or Cucumber) to
                       run the specs                                    [string]
-r, --reporters        reporters to print out the results on stdout      [array]
    --suite            overwrites the specs attribute and runs the defined
                       suite                                             [array]
    --spec             run only a certain spec file or wildcard - overrides
                       specs piped from stdin                            [array]
    --exclude          exclude certain spec file or wildcard from the test run
                       - overrides exclude piped from stdin              [array]
    --repeat           Repeat specific specs and/or suites N times      [number]
    --mochaOpts        Mocha options
    --jasmineOpts      Jasmine options
    --cucumberOpts     Cucumber options
    --coverage         Enable coverage for browser runner
    --headless         run all browser instances in headless mode, overrides
                       capability settings in wdio.conf.js             [boolean]
    --shard            Shard tests and execute only the selected shard.
                       Specify in the one-based form like `--shard x/y`, where
                       x is the current and y the total shard.
    --cpuProf          Enable Node.js CPU profiling for worker processes
                       (--cpu-prof)                                    [boolean]
    --heapProf         Enable Node.js heap profiling for worker processes
                       (--heap-prof)                                   [boolean]
    --debug            Pause failing tests and browser.debug() in an agent
                       session. Only `agent` is supported
                                                   [string] [choices: "agent"]
    --tsConfigPath     custom path for `tsconfig.json`                  [string]
```

Examples:

```sh
# run one suite
npx wdio run wdio.conf.ts --suite login

# run the first of four shards, e.g. in a CI matrix
npx wdio run wdio.conf.ts --shard 1/4

# run all browsers headless, or force headed mode
npx wdio run wdio.conf.ts --headless
npx wdio run wdio.conf.ts --headless=false

# set framework options with dot notation
npx wdio run wdio.conf.ts --mochaOpts.timeout 60000

# run a Cucumber scenario by line number
npx wdio run wdio.conf.ts --spec ./features/login.feature:5

# use a custom tsconfig.json
npx wdio run wdio.conf.ts --tsConfigPath=./configs/bdd-tsconfig.json

# pause failing tests and browser.debug() so a coding agent can inspect them
npx wdio run wdio.conf.ts --debug=agent
```

`--tsConfigPath` overrides the [`tsConfigPath`](/docs/configurationfile) setting of your configuration. See [TypeScript](/docs/typescript) for how WebdriverIO compiles your specs with `tsx`.

### `wdio install`

The `install` command adds a reporter, service, framework, plugin or runner to an existing project. It installs the package, adds it to your `package.json` and updates your configuration file.

```sh
npx wdio install service sauce        # installs @wdio/sauce-service
npx wdio install reporter dot         # installs @wdio/dot-reporter
npx wdio install framework mocha      # installs @wdio/mocha-framework
```

The packages are installed with the package manager that runs the command, so `pnpm wdio install reporter dot` installs with pnpm and `yarn wdio install reporter dot` with Yarn. `npx` and direct calls use npm.

If your configuration file is not `wdio.conf.(js|ts|cjs|mjs)` in the current folder, pass its location:

```sh
npx wdio install service sauce --config="./path/to/wdio.conf.ts"
```

`npx wdio install --help` prints every supported package with its npm name.

#### List of supported services

```
visual, ai, vite, nuxt, firefox-profile, gmail, sauce, testingbot,
browserstack, lighthouse, vscode, electron, tauri, tauri-plugin, dioxus,
appium, camera, eslinter, lambdatest, tvlabs, zafira-listener, reportportal,
docker, ui5, wiremock, ng-apimock, slack, cucumber-viewport-logger, intercept,
novus-visual-regression, rerun, winappdriver, ywinappdriver, performancetotal,
cleanuptotal, aws-device-farm, ms-teams, tesults, azure-devops, google-chat,
qmate-service, robonut, qunit, roku, obsidian, null-driver
```

#### List of supported reporters

```
spec, dot, junit, allure, sumologic, concise, json, reportportal, video,
cucumberjs-json, mochawesome, timeline, html-nice, slack, teamcity, delta,
testrail, light, jsonhtml
```

#### List of supported frameworks

```
mocha, jasmine, cucumber
```

#### List of supported plugins and runners

```
plugin: wait-for, harness, testing-library
runner: local, browser
```

### `wdio repl`

The `repl` command starts a WebDriver session and opens an interactive prompt where you run WebdriverIO commands. Use it to try out selectors and commands without writing a spec. See [REPL interface](/docs/repl) for more.

Start a local Chrome:

```sh
npx wdio repl chrome
```

Run in the Sauce Labs cloud:

```sh
npx wdio repl chrome --user $SAUCE_USERNAME --key $SAUCE_ACCESS_KEY
```

Use a capability from your configuration file, by index or by its multi-remote name:

```sh
npx wdio repl ./wdio.conf.ts 0 -p 9515
```

Attach to a running [`wdio session`](/docs/session) instead of starting a new browser:

```sh
npx wdio repl --session default
```

`repl` accepts the connection options of the [run command](#wdio-run) (`--hostname`, `--port`, `--path`, `--user`, `--key`, `--logLevel`, ...) and these mobile options. Use the long `--user` and `--udid` forms: `-u` is the short alias of both.

```
-v, --platformVersion  Version of OS for mobile devices                 [string]
-d, --deviceName       Device name for mobile devices                   [string]
    --udid             UDID of real mobile devices                      [string]
-s, --session          Attach to a running `wdio session` instead of starting a
                       browser                                          [string]
```

### `wdio session`

The `session` command drives a browser, mobile app or desktop app from the shell, one command per call. It is built for coding agents: they open a session, take snapshots, click and type, and export what they did as a test. See [wdio session](/docs/session) for the workflow and [wdio session commands](/docs/session-commands) for every action.

```sh
npx wdio session --help
```

## Next steps

- [Configuration File](/docs/configurationfile): every option of `wdio.conf.ts`
- [Getting Started](/docs/gettingstarted): set up a project with the wizard
- [REPL interface](/docs/repl): debug commands interactively
- [wdio session](/docs/session): drive a browser from the shell or an agent
