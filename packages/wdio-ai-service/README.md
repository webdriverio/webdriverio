WebdriverIO AI Service
======================

> Steps written as intent: `browser.act()` performs a user action described in natural language, `browser.extract()` reads typed data, with your own model.

```ts
import { z } from 'zod'

await browser.url('/shop')
await browser.act('Add a blue shirt in size M to the shopping cart')

const cart = await browser.extract(
    'the line items in the cart',
    z.array(z.object({ name: z.string(), size: z.string(), qty: z.number() }))
)
expect(cart).toContainEqual({ name: 'Blue Shirt', size: 'M', qty: 1 })
```

`act` hands the instruction to a model together with the `wdio session` actions (snapshot, click, fill, press, …). The model works through the page with refs from accessibility snapshots, and every step it takes runs as a regular WebdriverIO command with a stable selector. `act` does not assert, the test checks the outcome.

## Installation

```sh
npm install @wdio/ai-service --save-dev
```

Install the LangChain package of the provider you use:

| Provider | Package | API key |
| --- | --- | --- |
| `anthropic` | `@langchain/anthropic` | `ANTHROPIC_API_KEY` |
| `openai` | `@langchain/openai` | `OPENAI_API_KEY` |
| `openrouter` | `@langchain/openrouter` | `OPENROUTER_API_KEY` |
| `ollama` | `@langchain/ollama` | none, runs locally |
| `llama-cpp`, `lm-studio` | `@langchain/openai` | none, set `baseURL` |

## Configuration

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    // ...
    services: [['ai', {
        model: 'anthropic:claude-sonnet-5-5'
    }]]
}
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `model` | `string \| ModelConfig \| BaseChatModel` | `process.env.WDIO_AI_MODEL` | `'provider:model'`, a config object (`provider`, `model`, `baseURL`, `apiKey`, `temperature`, `maxTokens`) or any LangChain chat model. |
| `cache` | `'auto' \| 'write' \| 'heal' \| 'locked' \| 'off'` | `'auto'` | See [Cache](#cache). |
| `cacheDir` | `string \| (specPath) => string` | `<spec dir>/__act__/` | Where cache files live. |
| `instructions` | `string` | | Markdown file with project conventions, appended to the system prompt. |
| `maxSteps` | `number` | `15` | Tool calls one `act` may make. |
| `maxModelCalls` | `number` | | Model calls per worker. |
| `actions` | `string[]` | page actions of `wdio session` | Actions the model may use. Code execution, cookies, storage, mocks and emulation are never offered. |
| `effects` | `'strict' \| 'loose' \| 'off' \| { mode, ignore }` | `'strict'` | How replayed and healed steps are checked against what they did when recorded, see [Step effects](#step-effects). `ignore` adds URL patterns to the analytics hosts that never count. |
| `responseBodies` | `boolean` | `true` | Collect fetch and XHR response bodies over WebDriver BiDi so `extract` can read them, see [Extract](#extract). |
| `healEvidence` | `boolean` | `true` | Save screenshots of every heal and failed replay, plus a video where the browser records one, see [Heal evidence](#heal-evidence). |
| `workspace.dir` | `string` | `<outputDir>/ai` or `.wdio/ai` | Root of the evidence folders, see [Workspace](#workspace). |
| `workspace.keep` | `'on-failure' \| 'always' \| 'never'` | `'on-failure'` | Keep a test's folder when an `act` call failed or healed, or the test failed. |

Your model key never leaves your machine except to the model endpoint you configure.

## Usage

```ts
// placeholders: values are substituted after the model call and never sent to the model
await browser.act('Log in as {{email}} with password {{password}}', {
    values: { email: process.env.SHOP_USER!, password: process.env.SHOP_PASS! }
})
```

`act` resolves to `{ source, steps, summary }`. `steps` lists the WebdriverIO code that ran. When the model reports that the instruction cannot be completed, or the step limit or timeout (`timeout`, default 60s) is reached, `act` throws an `ActError` with the reason.

## Scope

`act` and `extract` are available on the browser, on elements and on browsing contexts:

```ts
// only the billing form: snapshots show nothing else, steps stay inside it
await $('form#billing').act('Fill in a valid German address')

// a cross-origin payment frame, held from the page
const page = await browser.url('https://shop.example/checkout')
const payment = await page.frame('https://pay.example/form')
await payment.act('Pay with the test card {{card}}', { values: { card: '4242 4242 4242 4242' } })
```

On a frame or a tab the steps run in that browsing context, and the browser goes back to where it was afterwards. On the browser the model can enter frames, go back to the top document and switch to a window a step opened. These steps are recorded and replayed like any other.

## Extract

`extract(instruction, schema, options?)` reads information from the page and validates it against a [Standard Schema](https://standardschema.dev): zod, valibot, arktype and others. The model can only read the page (`snapshot`, `find`, `get`, `is`, `scroll`, the workspace), never change it. When the schema library can describe itself as JSON Schema (zod 4 can), the model gets that shape. An answer that does not match is rejected and the model answers again once. `extract` results are never cached: a read has to see the current page.

Keep pass/fail decisions in code: let `extract` find the value, and assert it with `expect`.

Pages often show less than they load: a count instead of the items, a rounded price, a truncated name. Over WebDriver BiDi the service collects the bodies of the fetch and XHR responses with a text body that the page receives, using a network data collector (Chrome and Firefox). Before an `extract` call it writes the latest 50 to `/responses` in the workspace, with an index of method, URL and status. The model can read them and names the file as evidence. Analytics hosts and the `effects.ignore` patterns are left out. Set `responseBodies: false` to turn this off.

```ts
// the page only shows "2 items in your cart"
const skus = await browser.extract('the SKUs of the items in the cart', z.array(z.string()))
```

## Cache

The steps of every `act` call are recorded in `__act__/<spec file>.json` next to the spec. Commit the file. Later runs replay the steps without calling the model, so a passing run costs no tokens and is as fast as hand-written commands.

```json
{
    "version": 1,
    "entries": {
        "cart adds a shirt › #1": {
            "instruction": "Add a blue shirt in size M to the shopping cart",
            "platform": "web",
            "model": "anthropic:claude-sonnet-5-5",
            "recordedAt": "2026-10-01T12:00:00.000Z",
            "steps": [
                { "action": "click", "args": { "target": "role/link[name=\"Blue Shirt\"]" }, "code": "await $('role/link[name=\"Blue Shirt\"]').click()" },
                { "action": "click", "args": { "target": "role/button[name=\"Add to cart\"]" }, "code": "await $('role/button[name=\"Add to cart\"]').click()" }
            ]
        }
    }
}
```

An entry is keyed by the full test title and the position of the `act` call in the test (`#1`, `#2`, …), or by the `id` option. When the instruction text changes, the call is recorded again. Placeholders stay placeholders in the file.

## Healing

When a replayed step fails because the page changed, `act` heals it in two levels and reports every heal:

| Level | What happens | Model call | Reported as |
| --- | --- | --- | --- |
| 1 | Try the other recorded selectors of the element, then its role and accessible name with the [`role/` selector](https://webdriver.io/docs/selectors#role-selector). A selector is only used when it matches exactly one element. | no | `healed: 'cache'` |
| 2 | The model gets the steps that already ran and the failing step, and continues from the current page. | yes | `healed: 'model'` |

The healed steps replace the entry, except in `locked` mode, which heals at level 1 but writes nothing and fails instead of calling the model.

At the end of the run the service prints a summary:

```
@wdio/ai-service: 42 act calls · 39 from cache · 2 healed without the model · 1 healed by the model · 0 recorded by the model · 3.1k tokens
Healed:
  cart.e2e.ts › cart adds a shirt "Add a blue shirt to the cart": step 2 [data-testid="add"] → role/button[name="Add to cart"] (without the model)
    evidence: ./logs/ai/heals/cart.e2e.ts-cart-adds-a-shirt-1c71c48d
  checkout.e2e.ts › checkout pays "Pay with the test card": continued by the model
    evidence: ./logs/ai/heals/checkout.e2e.ts-checkout-pays-24560807
Updated cache entries: ./logs/act-cache
```

Every call also emits an `ai:act` event on `process` with `{ spec, test, instruction, source, healed, healedSteps, artifacts, error, usage, durationMs }`, so reporters can show it.

### Heal evidence

A heal is a change you should review, so the service shows you what happened. When a cached step fails, it saves:

- `failed.png`, the page when the step failed
- `step-1.png`, `step-2.png`, …, the page after each step that healed it
- a WebM video of the whole heal, in browsers that implement the WebDriver BiDi [`browsingContext.startScreencast`](https://w3c.github.io/webdriver-bidi/#command-browsingContext-startScreencast) command (Firefox today)

The files go to `<workspace.dir>/heals/<spec>-<test>-<id>/`, and the summary prints the folder. Nothing is captured while cached steps replay fine. Set `healEvidence: false` to turn it off. `workspace.keep: 'never'` also captures no heal evidence, so no screenshots of your app stay on disk.

| Mode | Cached | Not cached | Writes |
| --- | --- | --- | --- |
| `write` | replay | record with the model | the cache files |
| `heal` | replay | record with the model | `<outputDir>/act-cache/` only, the cache files stay unchanged |
| `locked` | replay | fail, never calls the model | nothing |
| `off` | always calls the model | | nothing |

`auto` is `heal` when `process.env.CI` is set and `write` otherwise. `wdio run -s` (`updateSnapshots: 'all'`) records every `act` call again.

## Step effects

Every recorded step also stores what it did: the fetch and XHR requests it sent (`POST /api/cart → 2xx`, IDs in the path become `:id`), the navigation it caused, a window it opened, the named parts of the page that changed (`status "Cart"`) and a dialog it opened. WebDriver BiDi delivers all of it as events, the page changes come from a `MutationObserver` the service installs as a preload script.

```json
"effect": { "requests": ["POST /api/cart → 2xx"], "changed": ["status \"Cart\""] }
```

A replayed or healed step is only accepted when it has the same effect:

- A healed step that clicks a similar but wrong element, for example a *Add to cart* button that now adds to the wishlist, sends a different request and is rejected.
- A step that still finds its element but no longer does anything fails with *"ran, but the step no longer causes POST /api/cart → 2xx. The app may have changed behavior, not just markup."*: a regression, not a markup change.
- A step that ran but did something else is never run again, not with another selector and not by the model, because it may already have submitted a form or a payment. `act` fails in every cache mode, and you decide whether the app changed on purpose.
- Steps the model takes to continue from a step whose element is gone have to cause the effect of that step.

| Mode | Check |
| --- | --- |
| `strict` | every recorded request, the navigation, the new window, every changed region and the dialog. Extra requests are fine. |
| `loose` | the navigation and at least one recorded request or changed region |
| `off` | only the target |

Requests to common analytics and telemetry hosts, websockets, beacons and assets never count. A step is done when its requests finished, no navigation is pending and the page had no changes for 100 ms, so `act` waits for slow requests instead of a fixed time. A replay waits up to 5 seconds, or the `waitforTimeout` of your config when it is longer. A step whose request is still running then fails with *"the step was still running after 8000ms (POST /api/cart), so its effect could not be checked"*, not as a behavior change, and a step recorded that way gets no effect.

WebDriver Classic sessions see navigation and page changes but not requests, new windows or dialogs, so only those parts are checked there, and the summary says so. Native app effects are not checked.

## Workspace

When the model works on a test, the service collects what happened in a folder per test, `<outputDir>/ai/<worker>/<spec>/<test>/`:

```
snapshots/003.txt   every snapshot the model took
console.ndjson      browser console, from the start of the session (BiDi)
network.ndjson      requests and responses (BiDi)
page.html           page source, when the model saves it with the `source` tool
outputs/            tool results too long for the prompt
steps.json          the steps that ran
```

The model can read the folder with the read-only file tools of [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview) (`ls`, `read_file`, `glob`, `grep`). It cannot write files or read anything outside the folder. Placeholder values are redacted from every file. A test that replays from the cache creates no folder. A failed `act` error names the folder, so you can look at what the model saw.

## Eject

Turn `act()` calls back into plain WebdriverIO code once they are recorded:

```sh
npx wdio-ai eject test/specs/cart.e2e.ts
```

```ts
// act: Add a blue shirt in size M to the shopping cart
await $('role/link[name="Blue Shirt"]').click()
await $('role/combobox[name="Size"]').selectByVisibleText('M')
await $('role/button[name="Add to cart"]').click()
```

The instruction stays as a comment. Placeholders become references to the `values` of the call. A call is matched by its instruction, or by its `id`. Calls that are not recorded yet, or recorded with different steps in several tests, are left alone and reported. Use `--test <full title>` to pick the entries of one test and `--dry-run` to print the result.

Without the testrunner:

```ts
import { remote } from 'webdriverio'
import { act } from '@wdio/ai-service'

const browser = await remote({ capabilities: { browserName: 'chrome' } })
await browser.url('https://shop.example')
await act(browser, 'Add a blue shirt to the shopping cart', { model: 'ollama:qwen3:8b' })
```

For more information on WebdriverIO see the [homepage](https://webdriver.io).
