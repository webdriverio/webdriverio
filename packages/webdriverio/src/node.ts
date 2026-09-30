import os from 'node:os'
import fs from 'node:fs'
import process from 'node:process'

import { downloadFile } from './node/downloadFile.js'
import { extensionDataFromPath } from './node/extensionArchive.js'
import { savePDF } from './node/savePDF.js'
import { saveRecordingScreen } from './node/saveRecordingScreen.js'
import { uploadFile } from './node/uploadFile.js'
import { saveScreenshot } from './node/saveScreenshot.js'
import { saveElementScreenshot } from './node/saveElementScreenshot.js'

export * from './index.js'

import { environment, type EnvironmentVariables } from './environment.js'

environment.value = {
    osType: () => os.type(),
    readFileSync: fs.readFileSync,
    downloadFile,
    savePDF,
    saveRecordingScreen,
    uploadFile,
    extensionDataFromPath,
    saveScreenshot,
    saveElementScreenshot,
    variables: process.env as EnvironmentVariables
}
