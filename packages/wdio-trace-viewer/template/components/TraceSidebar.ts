import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('trace-sidebar')
export class TraceSidebar extends LitElement {
    static styles = css`
    button {
      display: block;
      margin: 8px 0;
      width: 100%;
      background: white;
      border: 1px solid #ccc;
      padding: 0.5rem;
      text-align: left;
      cursor: pointer;
      border-radius: 4px;
    }
  `

    @property({ type: Array }) tests: string[] = []

    private handleClick(name: string) {
        this.dispatchEvent(
            new CustomEvent('select-test', {
                detail: name,
                bubbles: true,
                composed: true,
            })
        )
    }

    render() {
        return html`
            ${this.tests.map(
                (name) => html`<button @click=${() => this.handleClick(name)}>${name}</button>`
            )}
        `
    }
}
