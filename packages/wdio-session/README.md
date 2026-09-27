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
npx wdio session export > test/specs/cart.e2e.ts
npx wdio session close
```

The command is part of `@wdio/cli`. For the full guide, see
[webdriver.io/docs/session](https://webdriver.io/docs/session).
