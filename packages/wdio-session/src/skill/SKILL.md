---
name: wdio-session
description: Drive browsers, mobile apps and desktop apps with WebdriverIO from the shell to explore UI, verify changes and write tests.
---

# wdio session

`wdio session` keeps one WebdriverIO session alive between short shell commands. Use it to see or drive a real browser, mobile app, or desktop app, check a change, and turn the steps that worked into a test. Use `curl` or `fetch` instead when the question is only about an HTTP API.

## The loop

```sh
npx wdio session open chrome https://example.com
npx wdio session click e3
npx wdio session fill e5 Ada Lovelace && npx wdio session select e6 Pro && npx wdio session check e7 && npx wdio session click e8
npx wdio session get text e9
```

- **Open once.** Browsers run headless. `open` prints the page's interactive elements, so you can act right away. It also takes `firefox`, `edge`, `safari`, `android`, `ios`, `electron <app>` and more.
- **Act on refs.** Elements show up as `button "Add to cart" [ref=e3]`. Refs stay valid while the element exists.
- **Every action reports what changed:** new or changed lines with their refs (`+ status "Saved"`), or the new page's elements after a navigation. You rarely need a separate `snapshot`.
- **Chain steps with `&&`.** One shell call for several steps is faster, and a failing step stops the chain. Keep the steps that show the result (the filter that got applied, the item you picked) in calls of their own.
- **Big page?** `find <text>` prints only the matching part of the page, with refs, and scrolls it into view. A long `snapshot` prints in parts: `--offset <line>` gives the next one. `read` gives an article's text.
- **Output is ready to read.** No need for `head`, `grep`, `sed`, redirects or `sleep`: use `find`, `snapshot --offset` and `wait 2000`.
- **Show your answer.** Before you answer, leave the page on what proves it (`find`/`scroll` to it): what's on screen is the evidence.
- **No need to close.** The session shuts itself down when idle. Run `close` only to start over.

## Actions

| Action | Example |
| --- | --- |
| Look | `snapshot -i` (interactive only) · `snapshot` (with text) · `find "Add to cart"` · `read` (page text) · `screenshot` |
| Click | `click e3` · `click e3 --double` · `hover e3` · `scroll down` · `scroll e3` |
| Text | `fill e2 Ada Lovelace` (replaces) · `type e2 more` (appends) · `press Enter` · `press ArrowRight --times 5` |
| Values | `fill e4 65` sets sliders, dates and colors too |
| Forms | `select e4 Pro` · `check e5` · `uncheck e5` · `upload e6 ./file.pdf` |
| Read | `get text e9` · `get value e2` · `get url` · `get title` · `is visible e3` |
| Wait | `wait e3` · `wait --text "Saved"` · `wait --url /done` · `wait 2000` |
| Navigate | `navigate https://…` · `back` · `reload` · `tabs` · `tabs switch 1` |
| Frames | refs inside iframes work as they are · `frame e1` scopes snapshots to the iframe e1 · `frame top` |
| Code | `exec -e 'console.log(await $("h1").getText())'` |

Run `npx wdio session <action> --help` only when an action fails or you need a flag that isn't shown here.

## Code

Use `exec` for loops, conditions and assertions. Pipe longer code on stdin:

```sh
npx wdio session exec -e 'await expect($("h1")).toHaveText("Cart")'
npx wdio session exec <<'JS'
await $('aria/Sign in').click()
await expect(browser).toHaveUrl(expect.stringContaining('/dashboard'))
JS
```

WebdriverIO v10 rules: always `await` commands; `$` returns exactly one element and throws `StrictSelectorError` on more than one match; wrap code in single quotes so the shell does not run `$(…)`.

## Turn it into a test

Every action prints the WebdriverIO code it ran (`→ …`). `export` writes those steps as a spec:

```sh
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
```

No `wdio.conf.ts` yet? `npm init wdio@latest . -- --yes --typescript --framework mocha --browsers chrome --reporters spec`

## Debug a failing test

```sh
npx wdio run wdio.conf.ts --debug=agent
npx wdio session -s debug-0-0 snapshot -i
npx wdio session -s debug-0-0 resume
```

## Errors

Exit codes: 1 the action or your code failed, 2 usage error, 3 missing dependency or credentials, 4 no session with that name. Errors print a hint on the next line. `npx wdio session doctor` checks the machine.
