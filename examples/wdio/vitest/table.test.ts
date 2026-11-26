import { inject, test } from 'vitest'

test.for(['buy milk', 'write tests', 'ship release'])('adds %s to the list', async (text, { expect }) => {
    await browser.url(inject('baseUrl'))
    await $('#todo-input').setValue(text)
    await $('#add-button').click()
    const items = await $$('#todo-list li').map((item) => item.getText())
    expect(items.at(-1)).toBe(text)
})
