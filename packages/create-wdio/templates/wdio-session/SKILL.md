---
name: wdio-session
description: Drive browsers, mobile apps and desktop apps with WebdriverIO from the shell to explore UI, verify changes and write tests.
---

# wdio session

`wdio session` keeps a WebdriverIO session alive between short shell commands. Use it to explore a UI, check a change, and turn the steps that worked into a test.

Use it when you need to see or drive a real browser, mobile app, or desktop app. Use `curl` or `fetch` instead when the question is only about an HTTP API.

## 1. Discover commands with `--help`

This file covers the core loop only. The CLI documents itself, and its help always matches the installed version:

```sh
npx wdio session --help            # the workflow, every action by group, global flags, exit codes
npx wdio session <action> --help   # arguments, flags, platforms, examples and related actions
```

Run `<action> --help` before you use an action for the first time in a task. Don't guess flags: an unknown flag fails with exit code 2.

## 2. The loop

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session snapshot -i
npx wdio session click e3 && npx wdio session wait --text "Cart (1)" && npx wdio session snapshot -i
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio session close
```

- **Open once.** Reuse the `default` session. Pass `-s <name>` only when you need two sessions at once. `open --help` lists every target: browsers, Android, iOS, macOS, Windows, Electron, Tauri, Dioxus, a wdio config, and cloud providers.
- **Observe before acting.** `snapshot -i` lists interactive elements with refs like `button "Add to cart" [ref=e3]`. Use `find <text>` on large pages. Take a screenshot only when the question is about layout.
- **Act on refs.** Refs stay valid while the element exists. After navigation, take a fresh snapshot.
- **Chain steps with `&&`.** One shell call per act-wait-observe step is faster than separate calls, and a failing step stops the chain.
- **Wait for a condition, not a time.** Use `wait <ref>`, `wait --text`, `wait --url` or `wait --load networkidle` instead of `sleep`.
- **Read before you assert.** `get text e1`, `get url` and `is visible e1` print values. Put assertions in `exec`.

## 3. Code

Use `exec` for loops, conditions and assertions. Pipe longer code on stdin:

```sh
npx wdio session exec -e 'await expect($("h1")).toHaveText("Cart")'
npx wdio session <<'JS'
await $('aria/Sign in').click()
await expect(browser).toHaveUrl(expect.stringContaining('/dashboard'))
JS
```

WebdriverIO v10 rules:

- Always `await` commands.
- `$` returns exactly one element. More than one match throws `StrictSelectorError`. A missing element stays unresolved until a command uses it.
- There is no sync mode and no `browser.element`.
- In the shell, wrap code in single quotes so `$(…)` is not run as command substitution.

Add a helper under `.wdio/helpers/` instead of a long `exec` script. Helpers become custom commands in the exported test.

## 4. Turn it into a test

Every action prints the WebdriverIO code it ran (`→ …`). `export` writes those steps as a spec:

```sh
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
```

No `wdio.conf.ts` yet? Create the project without prompts. Every wizard question has a flag, `npm init wdio@latest -- --help` lists them:

```sh
npm init wdio@latest . -- --yes --typescript --framework mocha --browsers chrome --reporters spec
```

## 5. Debug a failing test

```sh
npx wdio run wdio.conf.ts --debug=agent
npx wdio session -s debug-0-0 snapshot -i
npx wdio session -s debug-0-0 resume
```

`close` on that session fails the paused test.

## 6. Errors

| Exit | Meaning |
| --- | --- |
| 0 | Success |
| 1 | The action or your code failed |
| 2 | Usage error: check `<action> --help` |
| 3 | Missing dependency or credentials |
| 4 | No session with that name |

Errors print a hint on the next line. `npx wdio session doctor` checks the machine; `doctor <target>` checks one target.
