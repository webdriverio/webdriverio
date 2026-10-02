WebdriverIO AI Service
======================

> Steps written as intent: `browser.act()` performs a user action described in natural language with your own model.

```ts
await browser.url('/shop')
await browser.act('Add a blue shirt in size M to the shopping cart')
await expect($('#cart-count')).toHaveText('1')
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
| `instructions` | `string` | | Markdown file with project conventions, appended to the system prompt. |
| `maxSteps` | `number` | `15` | Tool calls one `act` may make. |
| `maxModelCalls` | `number` | | Model calls per worker. |
| `actions` | `string[]` | page actions of `wdio session` | Actions the model may use. Code execution, cookies, storage, mocks and emulation are never offered. |

Your model key never leaves your machine except to the model endpoint you configure.

## Usage

```ts
// placeholders: values are substituted after the model call and never sent to the model
await browser.act('Log in as {{email}} with password {{password}}', {
    values: { email: process.env.SHOP_USER!, password: process.env.SHOP_PASS! }
})
```

`act` resolves to `{ source, steps, summary }`. `steps` lists the WebdriverIO code that ran. When the model reports that the instruction cannot be completed, or the step limit or timeout (`timeout`, default 60s) is reached, `act` throws an `ActError` with the reason.

Without the testrunner:

```ts
import { remote } from 'webdriverio'
import { act } from '@wdio/ai-service'

const browser = await remote({ capabilities: { browserName: 'chrome' } })
await browser.url('https://shop.example')
await act(browser, 'Add a blue shirt to the shopping cart', { model: 'ollama:qwen3:8b' })
```

For more information on WebdriverIO see the [homepage](https://webdriver.io).
