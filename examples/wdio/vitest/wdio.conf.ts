import { fileURLToPath } from 'node:url'

const fromHere = (file: string) => fileURLToPath(new URL(file, import.meta.url))
const RESULTS_DIR = fromHere('./results')

export const config: WebdriverIO.Config = {
    runner: 'local',
    framework: 'vitest',
    specs: ['./*.test.ts'],
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: true,
        'wdio:experimentalBiDiCommands': true,
        'goog:chromeOptions': { args: ['--headless=new'] }
    }],
    reporters: [['junit', { outputDir: RESULTS_DIR }]],
    vitestOpts: {
        parallelMode: 'contexts',
        maxParallelContexts: 3,
        globalSetup: [fromHere('./global-setup.ts')],
        setupFiles: [fromHere('./setup.ts')],
        reporters: ['default', ['junit', { outputFile: `${RESULTS_DIR}/vitest-junit.xml` }]]
    }
}
