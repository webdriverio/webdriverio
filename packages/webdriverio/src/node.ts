import os from 'node:os'
import { AsyncLocalStorage } from 'node:async_hooks'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import process from 'node:process'

import { setCommandHookStore } from '@wdio/utils'

import { downloadFile } from './node/downloadFile.js'
import { extensionDataFromPath } from './node/extensionArchive.js'
import { savePDF } from './node/savePDF.js'
import { saveRecordingScreen } from './node/saveRecordingScreen.js'
import { saveScreenshot } from './node/saveScreenshot.js'
import { saveElementScreenshot } from './node/saveElementScreenshot.js'

export * from './index.js'

import { environment, type EnvironmentVariables } from './environment.js'
import { setParallelContextStore } from './session/context.js'

setParallelContextStore(new AsyncLocalStorage<string>())
setCommandHookStore(new AsyncLocalStorage<true>())

environment.value = {
    osType: () => os.type(),
    readFileSync: fs.readFileSync,
    downloadFile,
    savePDF,
    saveRecordingScreen,
    extensionDataFromPath,
    saveScreenshot,
    saveElementScreenshot,
    createRequire,
    get variables() {
        return (globalThis.process?.env ?? process.env) as EnvironmentVariables
    }
}
