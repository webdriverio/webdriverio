import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
    // Define scoped styles right with your component, in plain CSS
    static styles = css`
    :host {
        color: blue;
    }`

    // Declare reactive properties
    @property()
    // eslint-disable-next-line indent
    name?: string = 'World'

    // Render the UI as a function of component state
    render() {
        return html`<p>Hello, ${this.name}! ${this.getQuestion()}</p>`
    }

    getQuestion () {
        return 'How are you today?'
    }
}
