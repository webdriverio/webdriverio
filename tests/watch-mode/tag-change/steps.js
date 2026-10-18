import fs from 'node:fs'
import path from 'node:path'
import { Given } from '@wdio/cucumber-framework'

Given('the scenario of feature {word} runs', (name) => {
    fs.appendFileSync(path.join(process.env.WDIO_WATCH_DIR, 'ran.log'), `${name}\n`)
})
