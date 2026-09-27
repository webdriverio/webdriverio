---
name: wdio-session
description: Drive browsers, mobile apps and desktop apps with WebdriverIO from the shell to explore UI, verify changes and write tests.
---

# wdio session

`wdio session` keeps a WebdriverIO session alive between short shell commands. Use it to explore a UI, check a change, and turn the steps that worked into a test.

## 1. When to use it

Use `wdio session` when you need to see or drive a real browser, mobile app, or desktop app.

Use `curl` or `fetch` instead when the question is only about an HTTP API and no UI is involved.

## 2. Start

Reuse the `default` session. Pass `-s <name>` only when you need two sessions at once.

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session open firefox http://localhost:3000
npx wdio session open android --app ./shop.apk
npx wdio session open ios --bundle-id com.example.shop
npx wdio session open electron ./dist/shop
npx wdio session open macos --bundle-id com.example.shop
npx wdio session open windows --app Root
```

Cloud: `open chrome --provider browserstack` (also `saucelabs`, `testingbot`, `testmu`).

## 3. Observe before acting

```sh
npx wdio session snapshot --interactive
npx wdio session find "Add to cart"
npx wdio session diff
```

Refs look like `button "Add to cart" [ref=e3]`. Take a screenshot only when the question is about layout.

## 4. Act

Use refs from the latest snapshot. Snapshot again after navigation. Prefer `exec` when a step is more than one command.

```sh
npx wdio session click e3
npx wdio session fill e2 ada@example.com
npx wdio session <<'JS'
await $('aria/Cart (1)').waitForDisplayed()
JS
```

WebdriverIO v10 rules:

- Always `await` commands.
- `$` returns exactly one element. A missing element throws.
- There is no sync mode and no `browser.element`.

## 5. Verify

Put assertions in `exec`. Use `visual check` when the question is how the screen looks.

```sh
npx wdio session exec -e "await expect($('h1')).toHaveText('Cart')"
npx wdio session visual check cart
```

## 6. Turn it into a test

```sh
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
```

## 7. Missing tool

Add a helper under `.wdio/helpers/` instead of a long `exec` script. Helpers become custom commands in the exported test.

## 8. Debugging a failing test

```sh
npx wdio run wdio.conf.ts --debug=agent
npx wdio session -s debug-0-0 snapshot
npx wdio session -s debug-0-0 resume
```

`close` on that session fails the paused test.

## 9. Errors

| Exit | Meaning |
| --- | --- |
| 0 | Success |
| 1 | The action or your code failed |
| 2 | Usage error |
| 3 | Missing dependency or credentials |
| 4 | No session with that name |

`npx wdio session doctor` checks the machine. `doctor <target>` checks one target.

## 10. Clean up

```sh
npx wdio session close
```
