WebdriverIO Session
===================

> Drive browsers, mobile apps and desktop apps with WebdriverIO from the shell.

`wdio session` starts a WebdriverIO session that outlives the command that
created it, so a coding agent (or a human) can automate an app with many short
shell commands and turn what worked into a test.

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session snapshot
npx wdio session click e3
npx wdio session <<'JS'
await expect($('aria/Cart (1)')).toBeDisplayed()
JS
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio session close
```

The command is part of `@wdio/cli`. `npx wdio` installs the unscoped
[`wdio`](https://www.npmjs.com/package/wdio) package, which runs that CLI, so
you do not install `@wdio/session` or `@wdio/cli` first. For the full guide, see
[webdriver.io/docs/session](https://webdriver.io/docs/session).
Check a machine with `npx wdio session doctor`. Agents install the skill with
`npx wdio session skill --install .`.

## Use the actions from code

`@wdio/session/agent` runs the same actions, snapshots and refs on a browser
your code already owns, for example in a test or a `remote()` script. There is
no daemon. `dispose()` leaves the browser session open.

> **Experimental:** the `@wdio/session/agent` API, the snapshot text and the
> `RefEntry` fields `ref()` returns may change in a minor release. The ref
> syntax (`e3`) and the code an action records stay stable.

```ts
import { remote } from 'webdriverio'
import { createAgentSession } from '@wdio/session/agent'

const browser = await remote({ capabilities: { browserName: 'chrome' } })
const agent = await createAgentSession(browser, { captureEvents: true })

await browser.url('http://localhost:3000')
const { text } = await agent.snapshot({ interactive: true })
const { code } = await agent.run('click', { target: 'e3' })
console.log(code) // await $('role/button[name="Add to cart"]').click()

await agent.dispose()
await browser.deleteSession()
```

`run(action, args)` type-checks the action name and its arguments against the
action specs: positionals and options are camelCased (`--max-chars` becomes
`maxChars`) and a variadic positional is one string. A typo is a compile error.
Use `runAction(name, args)` when the name is only known at runtime, for example
from a recorded step. It takes untyped arguments.

`snapshot(opts)` returns an `AgentSnapshot`: `text`, the `tree`, and the
`lines`, `refs` and `chars` counts, plus `page` and `notes` when there are any.
`maxChars` caps the size. Above it `tooBig` is `true` and `text` is a summary.
It writes no file and works for app (Appium) sessions too.

Action results carry structured fields next to `text` and `code`:

- `changes`: what the page shows after the action, a `PageChange` of kind
  `page` (a navigation or new frame), `changed` (added elements) or `removed`.
- `noVisibleChange`: `true` after a click or tap that changed nothing.
- `page` and `notes`: the URL and title, and load-error or bot-check notes.
- `data`: typed per action, for example `get` gives `{ text, value, ... }`.

Hints in the output name `wdio session` commands. The `hint` option rewrites
them for your own tools. Return `undefined` to keep the CLI text:

```ts
const tools: Record<string, string> = { snapshot: 'page_snapshot', click: 'page_click' }
const agent = await createAgentSession(browser, {
    hint: (command) => (tools[command] ? `${tools[command]}()` : undefined)
})
```

Failures throw `SessionError`, with a `code` of type `ErrorCode`. Both are
exported from `@wdio/session/agent`.

`tsx` and `expect-webdriverio` are optional peer dependencies. `expect` inside
`exec` needs `expect-webdriverio` installed in your project. TypeScript configs
load without `tsx` through Node type stripping or jiti.
