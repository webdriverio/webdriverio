import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('trace-details')
export class TraceDetails extends LitElement {
    static styles = css`
    .card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    h3 {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pass {
      color: green;
      font-weight: bold;
    }
    ul {
      margin-top: 1rem;
      padding-left: 1.2rem;
    }
    li {
      margin-bottom: 0.5rem;
      font-family: monospace;
    }
    code {
      background: #f3f3f3;
      padding: 2px 4px;
      border-radius: 4px;
    }
  `

    @property({ type: Array }) test: any[] | null = null

    render() {
        if (!this.test || this.test.length === 0) {
            return html`<p>Select a test to view details</p>`
        }

        const start = this.test.find((entry) => entry.type === 'test:start')
        const pass = this.test.find((entry) => entry.type === 'test:pass')
        const commands = this.test.filter((entry) => entry.type === 'command')

        return html`
            <div class="card">
                <h3>
                ${start?.name ?? 'Unnamed Test'}
                ${pass ? html`<span class="pass">✅ passed</span>` : ''}
                </h3>
                <ul>
                ${commands.map((cmd) => {
                    const { method, endpoint } = cmd.command ?? {}
                    return html`
                    <li>
                        <strong>${method}</strong>
                        → <code>${endpoint}</code>
                    </li>
                    `
                })}
                </ul>
            </div>
        `
    }
}
