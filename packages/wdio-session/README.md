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
