import { describe, inject, test } from 'vitest'

async function addTodo (text: string) {
    await browser.url(inject('baseUrl'))
    await $('#todo-input').setValue(text)
    await $('#add-button').click()
    const items = await $$('#todo-list li').map((item) => item.getText())
    return items
}

describe.concurrent('todo list in separate windows', () => {
    test('adds alpha', async ({ expect }) => {
        expect(await addTodo('alpha')).toContain('alpha')
    })

    test('does not see the alpha item of the other window', async ({ expect }) => {
        expect(await addTodo('beta')).not.toContain('alpha')
    })
})
