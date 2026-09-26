# Example pipeline

A user installs WebdriverIO and runs an example. The script starts a real browser and a real driver, then performs the commands. That is the proof for session and browser behavior.

## Sub-features

- `example-standalone` starts Chrome headless through `remote()` and prints the loaded URL.
- `example-mocha` runs the Mocha testrunner against Chrome and asserts the WebdriverIO docs title.
- `example-pageobject` runs a page-object suite against a real login form in Chrome.
- `example-frameworks` runs the Jasmine, Cucumber, multiremote, custom reporter, and custom service testrunner examples.
- `example-bidi` runs a BiDi script that subscribes to browser log or network events.

## How to get to it (user POV)

- Standalone script: `examples/standalone/sample.js`
- Testrunner examples, from `examples/wdio`: `pnpm run test:mocha`, `test:jasmine`, `test:cucumber`, `test:multiremote`, `test:customReporter`, `test:customService`
- Page objects: `examples/pageobject` then `pnpm run test`
- BiDi scripts: `examples/bidi/logging.js` and `examples/bidi/scripting.js` (Firefox or Chrome with `webSocketUrl: true`)

## Driving it with the WebdriverIO harness

Preconditions:

- `.agents/resume` prints `Ready.`
- Google Chrome is installed. BiDi logging uses Firefox.
- No other example is already driving a browser you started.
- The machine can reach the URL the script opens.

- **Standalone Chrome.** Run `cd examples/standalone && node sample.js`. Exit 0 and stdout contains `https://webdriver.io/`. The script deletes the session. A thrown error prints `Something went wrong:` and still deletes the session; that is a failure.
- **Mocha testrunner.** Run `cd examples/wdio && pnpm run test:mocha`. Exit 0. The spec reporter shows the title assertion passing. `onPrepare` prints `let's go` and `onComplete` prints `that's it`.
- **Page objects.** Run `cd examples/pageobject && pnpm run test`. Exit 0. Specs assert `Your username is invalid!` and `You logged into a secure area!` on `http://the-internet.herokuapp.com`.
- **Other testrunner examples.** Run the matching script from `examples/wdio/package.json` (`test:jasmine`, `test:cucumber`, `test:multiremote`, `test:customReporter`, `test:customService`). Exit 0 and the spec reporter shows passing tests.
- **BiDi.** Run `cd examples/bidi && node logging.js`. Exit 0 and stdout includes the log entry from `console.log('Hello Bidi')`.
- **Proof.** Save output to `.agents/verify-artifacts/example-pipeline/`. `result.txt` quotes the URL, title, or flash text the script asserted.

## Gotchas

- These examples open a real browser. Smoke cannot replace them.
- `examples/wdio/mocha/mocha.test.ts` asserts the live webdriver.io document title. A title change on that site fails the example even when the command works. Quote the actual title mismatch in `result.txt` instead of editing the assertion to force a pass.
- `sample.js` forces headless through `wdio:devtoolsOptions`. The `examples/wdio` configs request `browserName: 'chrome'` and do not set headless. If Chrome cannot open a window, say so and stop. Do not point the example at the mock service.
- `examples/cloudservices/` needs Sauce, BrowserStack, TestingBot, or Kobiton credentials. Without them the entry point is unreachable.
- One example at a time. Kill the PID you started. Do not kill every Chrome on the machine.
