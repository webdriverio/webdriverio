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

The session is named `default`. Pass `-s <name>` only when you need two sessions at once. The [targets](/docs/session/targets) page drives one Expo guinea pig in a headed Chrome window and in an Electron window, both at a desktop size. Android and iOS commands for the same app are on that page.

## Install

`wdio session` is part of the WebdriverIO CLI. `npx wdio` installs the unscoped [`wdio`](https://www.npmjs.com/package/wdio) package and runs that CLI. You do not install `@wdio/session` yourself.

```sh
npx wdio session --help
npx wdio session click --help
```

`--help` prints the workflow, the actions by group, global flags and exit codes. `<action> --help` prints that action's arguments, flags, platforms, examples and related actions. The same text is on the [commands](/docs/session-commands) page. The agent skill keeps only the core loop and sends agents to `--help` for the rest, so it does not go stale when the CLI changes.

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

Open headless Chrome (add `--headed` to show the window). `open` prints the page's interactive elements:

```sh
npx wdio session open chrome http://localhost:3000
```

An element looks like `button "Add to cart" [ref=e3]`. Use that ref. Every action reports what it changed on the page, with refs for new elements, so you rarely need a separate `snapshot`:

```sh
npx wdio session click e3
npx wdio session exec -e "await expect($('aria/Cart (1)')).toBeDisplayed()"
```

`open firefox`, `open edge` and `open safari` take the same URL. Chrome, Firefox and Edge are downloaded on first use when they are not installed. Safari requires macOS.

### Android

Android and iOS run through Appium 3. `doctor android` reports a missing server or driver with the install command.

```sh
npx wdio session doctor android
npx wdio session open android --app ./shop.apk
npx wdio session snapshot --interactive
npx wdio session tap e3
```

iOS: `open ios --bundle-id com.example.shop`. Native desktop: `open macos --bundle-id com.example.shop` and `open windows --app Root`.

### Electron

```sh
npx wdio session open electron ./main.js
npx wdio session snapshot --interactive
npx wdio session click e2
```

`open tauri ./my-app` and `open dioxus ./my-app` need their driver on `PATH`. On Linux without `DISPLAY` or `WAYLAND_DISPLAY`, install Xvfb or weston.

## Observation and refs

| Command | Use it for |
| --- | --- |
| `snapshot --interactive` | The elements you can act on, each with a ref |
| `snapshot --compact` | The same tree with unnamed empty wrappers removed |
| `snapshot --urls` | Link addresses on each link |
| `find "Add to cart"` | A line from a fresh snapshot |
| `diff` | What changed since the previous snapshot |
| `screenshot` | Layout. Skip it when a snapshot answers the question |
| `pdf` | A PDF of the current page (`pdf report.pdf`). BiDi sessions print headed and headless |
| `source` | The page HTML or the native XML |

Refs come from the latest snapshot. After navigation, snapshot again. An old ref fails with `REF_STALE`. An unknown ref fails with `REF_NOT_FOUND`.

## `exec`

`exec` runs WebdriverIO code. Always `await` commands. `$` returns one element and throws when it is missing. There is no sync mode and no `browser.element`.

```sh
npx wdio session exec -e "await browser.getTitle()"
npx wdio session <<'JS'
await $('aria/Cart (1)').waitForDisplayed()
JS
```

Put assertions in `exec` with `expect-webdriverio`. Use `visual check <tag>` (needs `@wdio/visual-service`) when the question is how the screen looks.

## Export

`export` writes a spec from the recorded steps. Refs are replaced with stable selectors.

```sh
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
npx wdio session close
```

`open firefox`, `open edge` and `open safari` take the same URL. Other targets, snapshots, `exec`, export and a paused test run are separate pages in this section.

## This section

| Page | Use it for |
| --- | --- |
| [Targets](/docs/session/targets) | Browsers, Android, iOS, desktop, Electron, Tauri, Dioxus and cloud devices, including the demo app in Chrome, Android and Electron |
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

- [Targets](/docs/session/targets) — open a browser, an Android or iOS app, or an Electron window
- [WebdriverIO for Coding Agents](/docs/ai-agents) — skill, docs and project rules
- [wdio session commands](/docs/session-commands) — every action and flag
