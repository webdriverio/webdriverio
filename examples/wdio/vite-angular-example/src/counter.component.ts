import { Component, signal } from '@angular/core'

@Component({
    selector: 'app-counter',
    template: `
        <button type="button" (click)="increment()">Increment</button>
        <output aria-label="Count">{{ count() }}</output>
    `
})
export class CounterComponent {
    readonly count = signal(0)

    increment() {
        this.count.update(value => value + 1)
    }
}
