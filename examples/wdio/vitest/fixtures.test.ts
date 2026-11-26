import { describe, inject, test as base } from 'vitest'

class TodoPage {
    get input () { return $('#todo-input') }
    get addButton () { return $('#add-button') }
    get items () { return $$('#todo-list li') }

    async open () {
        await browser.url(inject('baseUrl'))
    }

    async add (text: string) {
        await this.input.setValue(text)
        await this.addButton.click()
    }
}

const test = base.extend<{ todoPage: TodoPage, seededPage: TodoPage }>({
    // eslint-disable-next-line no-empty-pattern
    todoPage: async ({}, use) => {
        const todoPage = new TodoPage()
        await todoPage.open()
        await use(todoPage)
    },
    seededPage: async ({ todoPage }, use) => {
        await todoPage.add('seeded item')
        await use(todoPage)
    }
})

describe('todo page fixtures', () => {
    test('shows the add button', async ({ todoPage }) => {
        await expect(todoPage.addButton).toBeDisplayed()
    })

    test('keeps the seeded item', async ({ seededPage, expect }) => {
        expect(await seededPage.items.map((item) => item.getText())).toContain('seeded item')
    })
})
