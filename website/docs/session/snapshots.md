---
id: snapshots
title: Snapshots and refs
description: Read the page with wdio session snapshot, then act on the refs it prints.
---

Take a snapshot before you click. The snapshot is the list of elements you can act on. Each interactive line ends with a ref such as `[ref=e3]`.

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session snapshot --interactive
```

A line looks like `button "Add to cart" [ref=e3]`. The next command uses that ref:

```sh
npx wdio session click e3
```

Refs come from the latest snapshot. After navigation, snapshot again. An old ref fails with `REF_STALE`. An unknown ref fails with `REF_NOT_FOUND`.

## What to run

| Command | Use it for |
| --- | --- |
| `snapshot --interactive` | The elements you can act on, each with a ref |
| `find "Add to cart"` | One line from a fresh snapshot |
| `diff` | What changed since the previous snapshot |
| `screenshot` | Layout. Skip it when a snapshot answers the question |
| `source` | The page HTML or the native XML |

`snapshot` without `--interactive` includes more of the tree. Prefer `--interactive` when you are about to click or type.

On Android, iOS, macOS and Windows the snapshot comes from the Appium page source. Two controls that share an accessibility id stay separate refs when the rest of their selectors differ. `snapshot --scope e3` limits the tree to that ref.

## Native taps

Web sessions use `click`. Mobile and native desktop sessions use `tap` on the same ref:

```sh
npx wdio session open android --app ./shop.apk
npx wdio session snapshot --interactive
npx wdio session tap e3
```

## Troubleshooting

| Message | What to do |
| --- | --- |
| `REF_STALE` | The element from the last snapshot is gone. Run `snapshot` and use a new ref. |
| `REF_NOT_FOUND` | That id was never in this session. The ref in your command does not match the latest snapshot. |
| `NO_MATCH` | `find` did not see that text. Snapshot and read the names that are actually there. |

## Next steps

- [Run code](/docs/session/exec) — assertions and steps that are more than one command
- [Commands](/docs/session-commands) — `snapshot`, `find`, `diff`, `screenshot` and `source` flags
