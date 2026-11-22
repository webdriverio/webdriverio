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

:::caution Experimental

The text layout of a snapshot, and the shape `--json` prints for it, are experimental: a minor release may change them, for example to share one snapshot engine with the [DevTools trace](/docs/devtools/wdio/trace-mode). The ref syntax (`e3`, `@e3`), the actions that take a ref and the code they record stay stable. Take refs from a snapshot and don't parse the rest of its lines.

:::

## What to run

| Command | Use it for |
| --- | --- |
| `snapshot --interactive` | The elements you can act on, each with a ref |
| `find "Add to cart"` | Each match with the node around it, e.g. a whole list item, so a value next to the match comes along. `-A`, `-B` and `-C` print plain line context like grep |
| `pick add the hoodie to the cart` | The element an intent means, chosen by a decision model, with the probability of each candidate. See [Pick by intent](#pick-by-intent) |
| `diff`, `snapshot --diff` | What changed since the previous snapshot. With `snapshot --diff`, `--offset` above 1 and a web `--viewport` are usage errors, and a diff longer than `--max-chars` is cut at a line and names the snapshot file |
| `screenshot` | Layout. Skip it when a snapshot answers the question |
| `source` | The page HTML or the native XML |

`snapshot` without `--interactive` includes more of the tree. Prefer `--interactive` when you are about to click or type.

## What an action changed

In a web session, `open` prints the interactive snapshot of the page it opened, and every action that can change the page (`click`, `fill`, `type`, `press`, `select`, `check`, `navigate`, `frame`, …) reports what changed:

```text
Clicked e6 (button "Start subscription")
Changes:
+ - status "Subscription started. Confirmation code: 4F2A9C"
```

When the action opened a tab, the report says so (`Opened a new tab [1]: https://…`); the session stays on the current tab until you run `tabs switch`. When the page is a bot check (Cloudflare, DataDome, Akamai, …) rather than the site, the report says that too, once per page. The session doesn't try to get past it; in a headless browser it suggests reopening with `--headed`.

On the same page you get the new or changed lines with their refs, including text that is not interactive, like the status above. After a navigation you get the new page's interactive elements, or for a large page a one-line summary that points to `find`. So you rarely need a separate `snapshot` after an action. Set `WDIO_SESSION_CHANGES=0` to turn the report off, and pass `open --no-snapshot` to skip the snapshot after `open`.

## Frames

In a WebDriver BiDi session the snapshot shows the content of the page's iframes, cross-origin ones included, under the iframe they are in:

```text
- iframe "Payment" [ref=e4]
  - textbox "Card number" [ref=e5]
  - button "Pay" [ref=e6]
```

Actions on these refs enter the frame, act, and come back to the page, and the printed code does the same. Up to five iframes are shown, each cut at 300 elements; `frame e4` and `snapshot` show all of a frame that was cut short. Iframes smaller than 100 square pixels, like tracking pixels, are left out.

## Shadow DOM and clickable elements without a role

With WebDriver BiDi, the snapshot also covers closed shadow roots, and elements that only have a click listener (an icon wired up with `addEventListener`) get a ref. Such an element has no accessible name, so the snapshot describes it instead:

```text
- generic [ref=e8] (icon 3 of 3 in "Invoice #1002 · Contoso Ltd · $860.00")
```

On Android, iOS, macOS and Windows the snapshot comes from the Appium page source. Two controls that share an accessibility id stay separate refs when the rest of their selectors differ. `snapshot --scope e3` limits the tree to that ref.

## Repeated controls

When several controls share a role and a name, such as the "Add to cart" button of every row in a product table, the ref line ends with `∈ "<text>"`, the text of the row, card or list item that holds that control and no other of the same name:

```text
- button "Add to cart" [ref=e9] ∈ "Desk lamp · Brass · In stock · $49.00"
```

The text is cut at 80 characters. A control whose item is a page landmark (a "Sign in" link in both the header and the footer) gets none. The label of a visible form control is not listed: the control carries the name.

## Pick by intent

`find` needs text that is on the page. When the element you want shares no text with how you would describe it (an icon button, "the add to cart of the hoodie", "the email field of the newsletter form"), `pick` asks a decision model instead:

```sh
WDIO_PICK_URL=http://localhost:8080/v1 WDIO_PICK_MODEL=qwen3.5-4b npx wdio session open chrome http://localhost:3000/cart
npx wdio session pick add the hoodie to the cart --action click
```

```text
Picked e31 for "add the hoodie to the cart" (92%, next 4%, qwen3.5-4b):
e31    92%  button "Add to cart" ∈ "Red Hoodie" (under heading "Products" [level=1])
e30     4%  button "Add to cart" ∈ "Blue T-Shirt" (under heading "Products" [level=1])
e32     2%  button "Checkout" [disabled]
`wdio session click e31` acts on it.
```

`pick` never acts. The model reads up to 26 elements of a fresh snapshot, each with the text around it, and answers with one letter. `pick` reads the probability of every letter from the model's token probabilities. When the best candidate is below `--min-confidence` (default 0.6) or closer than `--min-margin` (default 0.2) to the next one, `pick` fails with exit code 1 and lists the candidates, so check them before you act.

The model server must speak the OpenAI chat completions API and return token probabilities (`logprobs`), for example [llama.cpp](https://github.com/ggml-org/llama.cpp) `llama-server` or vLLM. A small local model is enough because it only chooses a letter. Set `WDIO_PICK_URL` and `WDIO_PICK_MODEL` (and `WDIO_PICK_API_KEY` for a hosted server) before `open`, because the session reads them when it starts, or pass `--url` and `--model` to `pick`. `pick` switches a Qwen model's thinking off. A model that starts its answer with a thinking token has no probabilities for the letters.

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
| `NOT_EDITABLE` | The `fill` target is not an editable field and has no single editable field inside it (or behind `aria-controls`/`aria-owns`/label). Run `snapshot --scope <target>` and fill the field ref. |

## Next steps

- [Run code](/docs/session/exec) — assertions and steps that are more than one command
- [Commands](/docs/session-commands) — `snapshot`, `find`, `diff`, `screenshot` and `source` flags
