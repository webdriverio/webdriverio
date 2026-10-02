import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { ScriptedChatModel } from '../../../packages/wdio-ai-service/tests/__fixtures__/scriptedModel.js'

/**
 * Cache files of this suite go to a temporary directory, so a run never
 * writes into the repository. The launcher creates it, workers inherit it
 * through the environment, so a spec and the service always share it.
 */
process.env.WDIO_AI_E2E_DIR ??= fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-e2e-'))
export const cacheDir = process.env.WDIO_AI_E2E_DIR

/**
 * The tool calls a model would make, in the order the specs call `act`.
 * Each spec runs in its own worker and imports its own model, so the specs
 * can check what the model was sent.
 */
export const actModel = new ScriptedChatModel([
    // performs the steps the model chose in a real browser
    { tool: 'snapshot' },
    { tool: 'click', args: { target: 'role/button[name="Add to cart"]' } },
    { tool: 'done', args: { summary: 'Added the item to the cart' } },
    // fills a value without sending it to the model
    { tool: 'fill', args: { target: 'role/textbox[name="Email"]', text: '{{email}}' } },
    { tool: 'done', args: { summary: 'Filled in the email' } },
    // fails with the reason the model gave
    { tool: 'fail', args: { reason: 'There is no checkout button on this page' } }
])

export const cacheModel = new ScriptedChatModel([
    // records once, then replays without the model
    { tool: 'click', args: { target: 'role/button[name="Add to cart"]' } },
    { tool: 'done', args: { summary: 'Added the item' } }
])

export const workspaceModel = new ScriptedChatModel([
    // reads console output and page source from the workspace
    { tool: 'snapshot' },
    { tool: 'read_file', args: { file_path: '/console.ndjson' } },
    { tool: 'source' },
    { tool: 'grep', args: { pattern: 'data-sku' } },
    { tool: 'click', args: { target: 'role/button[name="Add to cart"]' } },
    { tool: 'done', args: { summary: 'Added the item after checking the stock warning' } }
])

export const extractModel = new ScriptedChatModel([
    // reads typed data from a real page
    { tool: 'snapshot' },
    { tool: 'get', args: { sub: 'text', target: 'role/row[name="Blue Shirt M 1"]' } },
    { tool: 'answer', args: { value: [{ name: 'Blue Shirt', size: 'M', qty: 1 }, { name: 'Red Socks', size: 'L', qty: 2 }], evidence: ['role/row[name="Blue Shirt M 1"]'] } },
    // reads a value the page only received from its API
    { tool: 'read_file', args: { file_path: '/responses/index.ndjson' } },
    {
        tool: 'read_file',
        args: (index) => {
            const file = index.match(/(\/responses\/[^"\\]+-api-cart\.json)/)?.[1]
            if (!file) {
                throw new Error(`no cart response in:\n${index}`)
            }
            return { file_path: file }
        }
    },
    {
        tool: 'answer',
        args: (body) => ({ value: [...body.matchAll(/sku\\?":\s*\\?"([^"\\]+)/g)].map((match) => match[1]), evidence: ['/responses/index.ndjson'] })
    }
])

const refOf = (pattern: RegExp) => (snapshot: string) => {
    const ref = snapshot.match(pattern)?.[1]
    if (!ref) {
        throw new Error(`no ref for ${pattern} in:\n${snapshot}`)
    }
    return ref
}

export const scopeModel = new ScriptedChatModel([
    // acts inside the element it was called on
    { tool: 'snapshot' },
    { tool: 'fill', args: (snapshot) => ({ target: refOf(/textbox "Email" \[ref=(e\d+)\]/)(snapshot), text: '{{email}}' }) },
    { tool: 'done', args: { summary: 'Filled in the billing email' } }
])

export const effectsModel = new ScriptedChatModel([
    // records what a step did, without the ignored telemetry request
    { tool: 'click', args: { target: '[data-testid="add"]' } },
    { tool: 'done', args: { summary: 'Added it' } },
    // waits until a slow request finished before act returns
    { tool: 'click', args: { target: '[data-testid="add"]' } },
    { tool: 'done', args: { summary: 'Added it' } }
])

export const framesModel = new ScriptedChatModel([
    // acts inside a held cross-origin frame
    { tool: 'snapshot' },
    { tool: 'click', args: (snapshot) => ({ target: refOf(/button "Pay now" \[ref=(e\d+)\]/)(snapshot) }) },
    { tool: 'done', args: { summary: 'Paid' } },
    // enters a cross-origin frame by itself and the steps replay without the model
    { tool: 'snapshot' },
    { tool: 'frame', args: (snapshot) => ({ target: refOf(/iframe "Payment" \[ref=(e\d+)\]/)(snapshot) }) },
    { tool: 'snapshot' },
    { tool: 'click', args: (snapshot) => ({ target: refOf(/button "Pay now" \[ref=(e\d+)\]/)(snapshot) }) },
    { tool: 'frame', args: { target: 'top' } },
    { tool: 'done', args: { summary: 'Paid in the frame' } },
    // switches to a window an action opened
    { tool: 'snapshot' },
    { tool: 'click', args: (snapshot) => ({ target: refOf(/button "Open help" \[ref=(e\d+)\]/)(snapshot) }) },
    { tool: 'tabs', args: { sub: 'switch', arg: '1' } },
    { tool: 'snapshot' },
    { tool: 'click', args: (snapshot) => ({ target: refOf(/button "Confirm" \[ref=(e\d+)\]/)(snapshot) }) },
    { tool: 'done', args: { summary: 'Confirmed in the help window' } }
])
