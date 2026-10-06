WebdriverIO Snapshot
====================

> Accessibility-style snapshots of web pages and native apps.

`@wdio/snapshot` turns a page (or an Appium page source) into a compact text
tree with stable element refs. It is the engine behind `wdio session snapshot`.

```ts
import { collectWeb, formatSnapshot, RefRegistry } from '@wdio/snapshot'
```
