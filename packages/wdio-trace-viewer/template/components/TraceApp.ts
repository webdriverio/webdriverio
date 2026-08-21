import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './TraceSidebar.js'
import './TraceDetails.js'
import './TraceHeader.js'

@customElement('trace-app')
export class TraceApp extends LitElement {
    static styles = css`
    :host {
      display: block;
    }
    .layout {
      display: flex;
      height: 100vh;
    }
    .sidebar {
      width: 240px;
      background: #1e1e2f;
      padding: 8px;
    }
    .main {
      flex: 1;
      padding: 16px;
      background: #f8f8f8;
    }
    h1 {
      font-size: 1.5rem;
      margin: 0;
      padding: 1rem;
    }
  `

    @state() private groupedTests: Array<{ name: string, events: any[] }> = []
    @state() private selectedTestName: string | null = null

    async connectedCallback() {
        super.connectedCallback()

        try {
            const res = await fetch('/__trace_data/report.json')
            if (!res.ok) {throw new Error(`HTTP ${res.status} - ${res.statusText}`)}

            const rawData: any[] = await res.json()

            this.groupedTests = this.groupTestEvents(rawData)
        } catch (err) {
            console.error('Failed to load report.json:', err)
        }
    }

    private groupTestEvents(rawData: any[]): Array<{ name: string, events: any[] }> {
        const tests: Array<{ name: string; events: any[] }> = []
        let currentTest: { name: string; events: any[] } | null = null

        for (const entry of rawData) {
            if (entry.type === 'test:start') {
                if (currentTest) {
                    tests.push(currentTest)
                }
                currentTest = {
                    name: entry.name,
                    events: [entry]
                }
                continue
            }

            // Handle skipped tests (no test:start)
            if (entry.type === 'test:skip') {
                tests.push({
                    name: entry.name,
                    events: [entry]
                })
                continue
            }

            // Append other events to current test
            if (currentTest) {
                currentTest.events.push(entry)
            }
        }

        if (currentTest) {
            tests.push(currentTest)
        }

        return tests
    }

    private handleTestSelect = (e: CustomEvent<string>) => {
        const clickedName = e.detail
        this.selectedTestName = this.selectedTestName === clickedName ? null : clickedName
    }

    render() {
        const testNames = this.groupedTests.map(t => t.name)
        const selectedTest = this.groupedTests.find(t => t.name === this.selectedTestName)

        return html`
            <trace-header></trace-header>
            <div class="layout">
                <div class="sidebar">
                    <trace-sidebar
                        .tests=${testNames}
                        @select-test=${this.handleTestSelect}
                    ></trace-sidebar>
                </div>
                <div class="main">
                    <trace-details .test=${selectedTest?.events || []}></trace-details>
                </div>
            </div>
        `
    }
}
