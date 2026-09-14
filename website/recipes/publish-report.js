import { v4 as uuidv4 } from 'uuid'
import { defineConfig } from '@wdio/config'
import { publishCucumberReport } from '@wdio/cucumber-framework'

export const config = defineConfig({
    // ... Other Configuration Options
    cucumberOpts: {
        // ... Cucumber Options Configuration
        format: [
            ['message', `./reports/${uuidv4()}.ndjson`],
            ['json', './reports/test-report.json']
        ]
    },
    async onComplete() {
        await publishCucumberReport('./reports')
    }
})