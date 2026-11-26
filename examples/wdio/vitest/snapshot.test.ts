import { inject, test } from 'vitest'

test('matches the default todo list', async ({ expect }) => {
    await browser.url(inject('baseUrl'))
    const items = await $$('#todo-list li').map((item) => item.getText())
    expect(items).toMatchSnapshot()
})
