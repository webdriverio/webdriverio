---
id: ai-steps
title: AI Steps in Tests
description: Write test steps as intent with browser.act() and read typed data with browser.extract() using @wdio/ai-service, then replay them from a committed cache without a model and review every heal.
---

`@wdio/ai-service` lets a test describe a step instead of scripting it: `browser.act('Add a blue shirt to the cart')` asks your model to perform it, records the WebdriverIO commands it ran, and replays them from a cache file on every later run. The model is only called again when the page changed and a recorded step can no longer be repaired without it. Use it for flows whose markup changes often, or to get a test running before you know the selectors. Use plain WebdriverIO commands for everything you already know how to script.

## Set up the service

Install the service and the LangChain package of your model provider:

```sh
npm install --save-dev @wdio/ai-service @langchain/anthropic zod
```

Add the service to your config and set the API key of the provider (`ANTHROPIC_API_KEY` here) in the environment:

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    specs: ['./test/specs/**/*.e2e.ts'],
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: true
    }],
    framework: 'mocha',
    services: [['ai', {
        model: 'anthropic:claude-sonnet-5-5'
    }]]
}
```

`webSocketUrl: true` opens a WebDriver BiDi session. The service works over WebDriver Classic too, but BiDi lets it check what every step did and read the API responses of the page. See the [AI Service](/docs/ai-service) page for every option and provider, including local models through Ollama.

## Write a test

```ts title="test/specs/cart.e2e.ts"
import { browser, expect } from '@wdio/globals'
import { z } from 'zod'

describe('cart', () => {
    it('adds a shirt', async () => {
        await browser.url('https://shop.example/')
        await browser.act('Add a blue shirt in size M to the shopping cart')

        const cart = await browser.extract(
            'the line items in the cart',
            z.array(z.object({ name: z.string(), size: z.string(), qty: z.number() }))
        )
        expect(cart).toContainEqual({ name: 'Blue Shirt', size: 'M', qty: 1 })
    })
})
```

- `act` performs the step and never asserts. Check the outcome with `expect`.
- `extract` only reads the page and validates the answer against the schema. It is never cached.
- Secrets go into placeholders. The model sees `{{password}}`, never the value:

```ts
await browser.act('Log in as {{email}} with password {{password}}', {
    values: { email: process.env.SHOP_USER!, password: process.env.SHOP_PASS! }
})
```

- Call `act` on an element to keep the model inside it, or on a held frame or tab:

```ts
await $('form#billing').act('Fill in a valid German address')
```

## Record once, replay without a model

The first run records the steps of every `act` call in `__act__/<spec file>.json` next to the spec:

```sh
npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts
```

Commit the `__act__` directory. Later runs replay the recorded commands, so a passing run makes no model calls and costs no tokens.

| `cache` | Use it for |
| --- | --- |
| `auto` (default) | `write` locally, `heal` when `process.env.CI` is set |
| `write` | recording and updating the cache files |
| `heal` | CI: repair failing steps, write the repaired entries to `<outputDir>/act-cache/` and leave the cache files alone |
| `locked` | CI runs that must not call a model: replay only, fail when a step cannot be repaired without the model |
| `off` | always ask the model |

Run `npx wdio run wdio.conf.ts -s` to record every `act` call again.

## Review heals

When a recorded step fails, the service first tries the other selectors it recorded for the element and then its role and accessible name. Only if that fails does the model continue from the failing step. Every replayed or healed step has to do what it did when it was recorded: send the same requests, navigate to the same page and change the same parts of the page. A heal onto a similar but wrong button is rejected.

The run ends with a summary:

```
@wdio/ai-service: 42 act calls · 39 from cache · 2 healed without the model · 1 healed by the model · 0 recorded by the model · 3.1k tokens
Healed:
  cart.e2e.ts › cart adds a shirt "Add a blue shirt in size M to the shopping cart": step 2 [data-testid="add"] → role/button[name="Add to cart"] (without the model)
    evidence: ./logs/ai/heals/cart.e2e.ts-cart-adds-a-shirt-1c71c48d
```

The evidence folder holds a screenshot of the page when the step failed, one after each healing step, and a video of the heal in browsers that record a WebDriver BiDi screencast (Firefox today). Review the heal, then commit the updated cache file.

## Turn steps into plain code

Once a flow is stable, replace its `act` calls with the recorded commands:

```sh
npx wdio-ai eject test/specs/cart.e2e.ts
```

```ts
// act: Add a blue shirt in size M to the shopping cart
await $('role/link[name="Blue Shirt"]').click()
await $('role/combobox[name="Size"]').selectByVisibleText('M')
await $('role/button[name="Add to cart"]').click()
```

## Troubleshooting

| Error | Fix |
| --- | --- |
| `act("…") failed: no model is configured. Set the `model` option of the service or the WDIO_AI_MODEL environment variable.` | Set `model` in the service options or export `WDIO_AI_MODEL=anthropic:claude-sonnet-5-5`. |
| `[@wdio/ai-service] The "anthropic" provider needs "@langchain/anthropic". Install it with `npm install --save-dev @langchain/anthropic`.` | Install the provider package. |
| `[@wdio/ai-service] No API key for "anthropic". Set ANTHROPIC_API_KEY or pass `apiKey` in the model config.` | Export the key in the shell or CI secret that runs the tests. |
| `act("…") failed: no cached steps for "…" and the cache is locked` | Record the call locally with `cache: 'write'` and commit the `__act__` file. |
| `act("…") failed: cached step 1 (…) ran, but the step no longer causes POST /api/cart → 2xx. The app may have changed behavior, not just markup.` | The element is still there but does something else: a regression, not a markup change. Check the app. |
| `act("…") failed: …` followed by `Evidence: <folder>` | The model could not complete the instruction. The folder has every snapshot it took, the console and network events and the steps that ran. |

## Next steps

- [AI Service](/docs/ai-service): every option, the cache format, step effects and the workspace
- [Selectors](/docs/selectors#role-selector): the `role/` selector recorded steps use
- [WebdriverIO for Coding Agents](/docs/ai-agents): write tests together with a coding agent
