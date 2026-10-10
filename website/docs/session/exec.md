---
id: exec
title: Run code in a session
description: Run WebdriverIO code and assertions in a live wdio session with exec.
---

`exec` runs WebdriverIO code in the open session. Use it when a step is more than a single `click` or `fill`, and for every assertion.

```sh
npx wdio session exec -e "await browser.getTitle()"
npx wdio session <<'JS'
await $('aria/Cart (1)').waitForDisplayed()
JS
```

Always `await` commands. `$` returns one element and throws when it is missing. `$$` returns a list. There is no sync mode and no `browser.element`.

Names you declare stay available in the next `exec`. A top-level `import` is loaded from the project directory.

## Assertions

Put assertions in `exec` with `expect-webdriverio`. Install it in your project. Without it, `expect(...)` fails with an install hint.

```sh
npx wdio session exec -e "await expect($('h1')).toHaveText('Cart')"
```

Use `visual check <tag>` when the question is how the screen looks. That command needs `@wdio/visual-service`:

```sh
npx wdio session visual check cart
```

`visual accept cart` copies the latest actual image for that tag over the baseline. It does not copy older images that share the tag prefix.

## When to use a shortcut instead

`click`, `fill`, `type`, `press` and `tap` are shorter than `exec` for one interaction, and they print the WebdriverIO line they ran. Prefer those with a ref from the latest [snapshot](/docs/session/snapshots). Use `exec` for waits, assertions and anything that needs more than one command.

## Next steps

- [Export a test](/docs/session/export) — save the steps, including `exec`
- [Commands](/docs/session-commands) — `exec` and `visual` flags
