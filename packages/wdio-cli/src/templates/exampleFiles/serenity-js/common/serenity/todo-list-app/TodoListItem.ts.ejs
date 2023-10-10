import { contain, not } from '@serenity-js/assertions'
import { Check, d, QuestionAdapter, Task } from '@serenity-js/core'
import { By, Click, CssClasses, PageElement } from '@serenity-js/web'

export class TodoListItem {

    // Public API captures the business domain-focused tasks
    // that an actor interacting with a TodoListItem app can perform

    static markAsCompleted = (item: QuestionAdapter<PageElement>) =>
        Task.where(d `#actor marks ${ item } as completed`,
            Check.whether(CssClasses.of(item), not(contain('completed')))
                .andIfSo(this.toggle(item)),
        )

    static markAsOutstanding = (item: QuestionAdapter<PageElement>) =>
        Task.where(d `#actor marks ${ item } as outstanding`,
            Check.whether(CssClasses.of(item), contain('completed'))
                .andIfSo(this.toggle(item)),
        )

    static toggle = (item: QuestionAdapter<PageElement>) =>
        Task.where(d `#actor toggles the completion status of ${ item }`,
            Click.on(
                TodoListItem.toggleButton().of(item),
            ),
        )

    // Private API captures ways to locate interactive elements and data transformation logic.
    // Private API supports the public API and is not used in the test scenario directly.

    private static toggleButton = () =>
        PageElement
            .located(By.css('input.toggle'))
            .describedAs('toggle button')
}
