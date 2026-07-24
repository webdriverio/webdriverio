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
      font-family: sans-serif;
    }

    h3 {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
    }

    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    .skip { color: gray; font-weight: bold; }

    ul {
      margin: 1rem 0 0;
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

    .http-log {
      margin-top: 1rem;
      background: #0d1117;
      color: #ffffff;
      padding: 1rem;
      border-radius: 8px;
    }

    .http-meta {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      color: #ccc;
      display: flex;
      gap: 1rem;
    }

    .method { color: #58a6ff; font-weight: bold; }
    .endpoint { color: #c9d1d9; }
    .status { color: #a5d6ff; margin-left: auto; }

    pre {
        background: #161b22;
        color: #fff;
        padding: 0.75rem;
        border-radius: 6px;
        overflow-x: auto;
        overflow-y: auto;
        font-size: 0.85rem;
        max-height: 40vh; /* flexible based on screen */
        white-space: pre-wrap;
        word-break: break-word;
    }
  `

    @property({ type: Array }) test: any[] | null = null

    render() {
        if (!this.test?.length) {
            return html`<p>Select a test to view details</p>`
        }

        const start = this.test.find(e => e.type === 'test:start')
        const pass = this.test.find(e => e.type === 'test:pass')
        const fail = this.test.find(e => e.type === 'test:fail')
        const skip = this.test.find(e => e.type === 'test:skip')
        const commands = this.test.filter(e => e.type === 'command')
        const httpLogs = this.test.filter(e => e.type === 'http')

        const { label, cssClass } = this.getStatus(pass, fail, skip)

        return html`
      <div class="card">
        <h3>
          ${start?.name ?? skip?.name ?? 'Unnamed Test'}
          <span class=${cssClass}>${label}</span>
        </h3>

        ${this.renderCommands(commands, fail, skip)}
        ${this.renderHttpLogs(httpLogs)}
      </div>
    `
    }

    private getStatus(pass: any, fail: any, skip: any) {
        if (pass) {return { label: '✅ Passed', cssClass: 'pass' }}
        if (fail) {return { label: '❌ Failed', cssClass: 'fail' }}
        if (skip) {return { label: '⚠️ Skipped', cssClass: 'skip' }}
        return { label: '', cssClass: '' }
    }

    private renderCommands(commands: any[], fail: any, skip: any) {
        if (commands.length > 0) {
            return html`
        <ul>
          ${commands.map(cmd => {
                const { method, endpoint } = cmd.command ?? {}
                return html`
              <li>
                <strong>${method}</strong>
                → <code>${endpoint}</code>
              </li>
            `
            })}
        </ul>
      `
        }

        if (skip) {
            return html`<p>This test was skipped and has no commands.</p>`
        }

        if (fail?.error) {
            return html`
                <div class="fail">
                    <strong>Error:</strong>
                    <pre>${JSON.stringify(fail.error, null, 2)}</pre>
                </div>
            `
        }

        return null
    }

    private renderHttpLogs(httpLogs: any[]) {
        if (httpLogs.length === 0) {return null}

        return html`
            <h4>Raw HTTP Log</h4>
            ${httpLogs.map(log => html`
                <div class="http-log">
                <div class="http-meta">
                    <span class="method">${log.method}</span>
                    <span class="endpoint">${log.endpoint}</span>
                    <span class="status">
                        ${log.statusCode}
                    </span>
                </div>
                <div>
                    <strong>Request</strong>
                    <pre>${JSON.stringify(log.requestBody, null, 2)}</pre>
                </div>
                <div>
                    <strong>Response</strong>
                    <pre>${JSON.stringify(log.responseBody, null, 2)}</pre>
                </div>
                </div>
            `)}
        `
    }
}
