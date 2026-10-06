WebdriverIO Snapshot
====================

> Accessibility-style snapshots of web pages and native apps.

`@wdio/snapshot` turns a page (or an Appium page source) into a compact text
tree with stable element refs. It is the engine behind `wdio session snapshot`
and is shared with the devtools element picker, so its API is kept small.

```ts
import { collectWeb, formatSnapshot, RefRegistry } from '@wdio/snapshot'

const refs = new RefRegistry()
const { tree, counter } = await collectWeb(browser, { counter: refs.counter, all: false, boxes: false }, { transport: 'classic-first' })
console.log(formatSnapshot(tree, { interactive: true }))
```

## Web

- `collectWeb(browser, options, how)` collects the page tree and returns
  `{ tree, counter, refs }`. `how.scope` limits it to the subtree of an
  element, `how.transport` is `'classic-first'` or `'bidi'`.
- `collectScript(options)` returns the collector as one self-contained
  expression for any page-eval API (`page.evaluate`, `Runtime.evaluate`).

Options (`CollectOptions`, without the role table, which the package adds):

| Option | Meaning |
|--------|---------|
| `counter`, `all`, `boxes`, `urls` | first ref number, include non-interactive nodes, include bounding boxes, include link URLs |
| `assignRefs` | `true` (default in `collectWeb`) stores refs in `window.__wdioSession` so they resolve later; `false` assigns none; `'ephemeral'` numbers refs and computes candidates but stores nothing |
| `viewport` | keep only what overlaps the viewport |
| `extendedCandidates` | also compute `aria-label`, `type`, `class` and `xpath-text` selector candidates (extra page-side work) |

## Native

- `nativePlatform(capabilities, target?)` returns `'android' | 'ios' | 'mac' | 'windows'`.
- `parseNativeSource(xml, platform, { all?, counter? })` returns `{ tree, refs, located, counter }`.
- `scopeNativeTree(tree, located, scope)` narrows a native tree to a scope.

## Trees and text

- `formatSnapshot(tree, options?)` renders the tree as text. Options: `depth`,
  `interactive`, `boxes`, `compact`, `selectors`, and `frameHint(ref)`, the
  command printed for cut and cross-origin iframes (without it the notes
  carry no instruction).
- `onlyInteractive(node)`, `inViewport(node, width, height)`,
  `attachSelectors(tree, refs)`, `countRefs(text)`.
- `diffLines(a, b)` and `unifiedDiff(before, after, context?)` compare snapshot text.
- Types: `SnapshotNode`, `SnapshotRef`, `SnapshotCandidate`, `CandidateKind`,
  `FormatOptions`, `CollectOptions`, `CollectResult`, `CollectHow`,
  `CollectWebResult`, `ParsedNative`, `Located`, `NativePlatform`.

## Refs and errors

- `RefRegistry` keeps `RefEntry` records, resolves a ref to an element and
  derives a stable selector. `refId(value)` normalizes `e12` and `@e12`.
- `SnapshotError` has a `code` and an optional `hint`.
