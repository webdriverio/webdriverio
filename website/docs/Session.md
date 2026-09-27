---
id: session
title: wdio session
description: Drive a browser, mobile app or desktop app from the shell with short wdio session commands, then export the steps as a test.
---

`wdio session` keeps one WebdriverIO session alive across many short shell commands. Use it to explore a UI, check a change, and turn the steps that worked into a test. It is part of `@wdio/cli` (WebdriverIO v10).

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session snapshot --interactive
npx wdio session click e3
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio session close
```

The session is named `default`. Pass `-s <name>` only when you need two sessions at once.

## Install

`wdio session` is part of the WebdriverIO CLI. `npx wdio` installs the unscoped [`wdio`](https://www.npmjs.com/package/wdio) package and runs that CLI. You do not install `@wdio/session` yourself.

```sh
npx wdio session --help
```

Scaffold a project with:

```sh
npm init wdio@latest
```

Accept "Set up coding agent support" to write `.agents/skills/wdio-session/SKILL.md`, an `AGENTS.md` section and a `.wdio/session/` gitignore entry. Install the skill later with:

```sh
npx wdio session skill --install .
```

`npx wdio session doctor` checks Node.js, the browser, Appium, SDKs and cloud credentials. `doctor <target>` checks only what that target needs. The process exits 1 when a check fails.

## Open a page and act on it

Open headless Chrome (add `--headed` to show the window) and read the page before clicking:

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session snapshot --interactive
```

A snapshot line looks like `button "Add to cart" [ref=e3]`. Use that ref:

```sh
npx wdio session click e3
npx wdio session exec -e "await expect($('aria/Cart (1)')).toBeDisplayed()"
```

Then save the steps and stop the session:

```sh
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
npx wdio session close
```

`open firefox`, `open edge` and `open safari` take the same URL. Other targets, snapshots, `exec`, export and a paused test run are separate pages in this section.

## This section

| Page | Use it for |
| --- | --- |
| [Targets](/docs/session/targets) | Browsers, Android, iOS, desktop, Electron, Tauri, Dioxus and cloud devices |
| [Snapshots and refs](/docs/session/snapshots) | What is on screen, and the refs you click |
| [Run code](/docs/session/exec) | `exec`, assertions and visual checks |
| [Export a test](/docs/session/export) | Specs, page objects and `.wdio/helpers` |
| [Debug a test](/docs/session/debug) | `wdio run --debug=agent` and `wdio repl --session` |
| [Commands](/docs/session-commands) | Every action and flag |

## Troubleshooting

| Message | What to do |
| --- | --- |
| `SESSION_EXISTS` | The name is already running. Use `-s` another name, or `open --replace`. |
| `REF_STALE` / `REF_NOT_FOUND` | Run `snapshot` again and use a ref from that output. |
| `MISSING_DEPENDENCY` | Install the package named in the error, or run `wdio session doctor <target>`. |
| `MISSING_APPIUM_DRIVER` | Run the `npx appium driver install …` line from the error. |
| `MISSING_CREDENTIALS` | Export the named variables. Doctor never prints their values. |
| `Session closed from wdio session` | The debug session was closed. Resume instead of close when the test should continue. |

Exit codes: 0 success, 1 the action failed, 2 usage, 3 a missing dependency or credentials, 4 no session with that name.

## Next steps

- [Targets](/docs/session/targets) — open something other than Chrome
- [WebdriverIO for Coding Agents](/docs/ai-agents) — skill, docs and project rules
- [wdio session commands](/docs/session-commands) — every action and flag
