import { ScriptedChatModel } from '../../../packages/wdio-ai-service/tests/__fixtures__/scriptedModel.js'

/**
 * The tool calls a model would make, in the order the specs run. The specs
 * import the same instance as the config, so they can check what the model
 * was sent.
 */
export const model = new ScriptedChatModel([
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
