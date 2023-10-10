import { contain, Ensure, equals, includes, isGreaterThan } from '@serenity-js/assertions'
import { type Answerable, Check, d, type QuestionAdapter, Task, Wait } from '@serenity-js/core'
import { By, Enter, ExecuteScript, isVisible, Key, Navigate, Page, PageElement, PageElements, Press, Text } from '@serenity-js/web'

import { TodoListItem } from './TodoListItem'

export class TodoList {

    // Public API captures the business domain-focused tasks
    // that an actor interacting with a TodoList app can perform

    static createEmptyList = () =>
        Task.where('#actor creates an empty todo list',
            Navigate.to('https://todo-app.serenity-js.org/'),
            Ensure.that(
                Page.current().title().describedAs('website title'),
                equals('Serenity/JS TodoApp'),
            ),
            Wait.until(this.newTodoInput(), isVisible()),
            TodoList.emptyLocalStorageIfNeeded(),
        )

    static emptyLocalStorageIfNeeded = () =>
        Task.where('#actor empties local storage if needed',
            Check.whether(TodoList.persistedItems().length, isGreaterThan(0))
                .andIfSo(
                    TodoList.emptyLocalStorage(),
                    Page.current().reload(),
                )
        )

    static createListContaining = (itemNames: Array<Answerable<string>>) =>
        Task.where(`#actor starts with a list containing ${ itemNames.length } items`,
            TodoList.createEmptyList(),
            ...itemNames.map(itemName => this.recordItem(itemName))
        )

    static recordItem = (itemName: Answerable<string>) =>
        Task.where(d `#actor records an item called ${ itemName }`,
            Enter.theValue(itemName).into(this.newTodoInput()),
            Press.the(Key.Enter).in(this.newTodoInput()),
            Wait.until(Text.ofAll(this.items()), contain(itemName)),
        )

    static markAsCompleted = (itemNames: Array<Answerable<string>>) =>
        Task.where(d`#actor marks the following items as completed: ${ itemNames }`,
            ...itemNames.map(itemName => TodoListItem.markAsCompleted(this.itemCalled(itemName)))
        )

    static markAsOutstanding = (itemNames: Array<Answerable<string>>) =>
        Task.where(d`#actor marks the following items as outstanding: ${ itemNames }`,
            ...itemNames.map(itemName => TodoListItem.markAsOutstanding(this.itemCalled(itemName)))
        )

    static outstandingItemsCount = () =>
        Text.of(PageElement.located(By.tagName('strong')).of(this.outstandingItemsLabel()))
            .as(Number)
            .describedAs('number of items left')

    // Private API captures ways to locate interactive elements and data transformation logic.
    // Private API supports the public API and is not used in the test scenario directly.

    private static itemCalled = (name: Answerable<string>) =>
        this.items()
            .where(Text, includes(name))
            .first()
            .describedAs(d`an item called ${ name }`)

    private static outstandingItemsLabel = () =>
        PageElement.located(By.css('.todo-count'))
            .describedAs('items left counter')

    private static newTodoInput = () =>
        PageElement.located(By.css('.new-todo'))
            .describedAs('"What needs to be done?" input box')

    private static items = () =>
        PageElements.located(By.css('.todo-list li'))
            .describedAs('displayed items')

    private static persistedItems = () =>
        Page.current()
            .executeScript(`
            return window.localStorage['serenity-js-todo-app']
                ? JSON.parse(window.localStorage['serenity-js-todo-app'])
                : []
        `).describedAs('persisted items') as QuestionAdapter<PersistedTodoItem[]>

    private static emptyLocalStorage = () =>
        Task.where('#actor empties local storage',
            ExecuteScript.sync(`window.localStorage.removeItem('serenity-js-todo-app')`)
        )
}

interface PersistedTodoItem {
    id: number;
    name: string;
    completed: boolean;
}
