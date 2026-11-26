import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeEach, onTestFailed } from 'vitest'

const RESULTS_DIR = fileURLToPath(new URL('./results', import.meta.url))

beforeEach(({ task }) => {
    onTestFailed(async () => {
        mkdirSync(RESULTS_DIR, { recursive: true })
        await browser.saveScreenshot(`${RESULTS_DIR}/${task.name.replace(/\W+/g, '_')}.png`)
    })
})
