---
id: export
title: Export a session as a test
description: Turn the steps you ran in wdio session into a spec, page objects and custom commands.
---

`export` writes a spec from the recorded steps. Refs are replaced with stable selectors. For a web page, the first of these that matches exactly one element is used: a test id (`data-testid`, `data-test`, `data-qa`), a [role selector](/docs/selectors#role-selector) such as `role/button[name="Add to cart"]`, an accessible name (`aria/Add to cart`), an id, the text of a button or link, a form field name, and finally a CSS path.

```sh
npx wdio session export --out test/specs/cart.e2e.ts
npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
```

`history` prints the steps before you export. `history clear` drops them.

## Page objects

`--page-objects` writes a page object next to the spec. Selectors are grouped by the path they ran on. A literal `$('…')` in a recorded step becomes a getter. `$$`, strings that happen to contain `$('…')`, and a dynamic `$(selector)` stay as they are.

```sh
npx wdio session export --page-objects --out test/specs/cart.e2e.ts
```

The command refuses to overwrite a page object that is already in the output directory. Move `--out` or remove that file first. The spec file itself is written again.

A `import` at the top of an `exec` step is hoisted to the top of the spec, outside the test function.

## Helpers

Add a file under `.wdio/helpers/` when a step is too long for `exec`. Each file default-exports a function that receives the browser and registers commands with `addCommand`. Relative imports stay relative to that file. Bare package imports resolve from the project.

```js title=".wdio/helpers/login.js"
import { mark } from './util.js'

export default function login (browser) {
    browser.addCommand('fillLogin', async (email) => {
        await browser.$('#email').setValue(email + mark)
    })
}
```

Helpers are loaded when the session opens and again with `npx wdio session helpers --reload`. If `.wdio/helpers` does not exist yet, the session watches for it. Helpers become custom commands in the exported test.

## Next steps

- [Run code](/docs/session/exec) — the steps `export` records
- [Commands](/docs/session-commands) — `export`, `history` and `helpers` flags
