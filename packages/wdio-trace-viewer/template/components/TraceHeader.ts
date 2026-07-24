import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('trace-header')
export class TraceHeader extends LitElement {
    static styles = css`
    :host {
      display: block;
      background: white;
      border-bottom: 1px solid #eee;
    }

    .header {
      display: flex;
      align-items: center;
      padding: 1rem;
    }

    img {
      height: 24px;
      margin-right: 0.5rem;
    }

    h1 {
      font-size: 1.5rem;
      margin: 0;
      font-weight: 600;
    }
  `

    render() {
        const logoUrl = new URL('/assets/wdio-log.svg', import.meta.url).pathname
        return html`
            <div class="header">
                <img src=${logoUrl} alt="WebdriverIO Logo" />
                <h1>WebdriverIO Trace Viewer</h1>
            </div>
        `
    }
}
