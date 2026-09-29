import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow } from 'electron'

const dir = path.dirname(fileURLToPath(import.meta.url))

function createMain () {
    const win = new BrowserWindow({
        width: 960,
        height: 640,
        backgroundColor: '#16120c',
        title: 'Launch console',
        webPreferences: { contextIsolation: true }
    })
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.includes('telemetry.html')) {
            return { action: 'deny' }
        }
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                width: 420,
                height: 640,
                backgroundColor: '#04140c',
                title: 'Telemetry'
            }
        }
    })
    win.loadFile(path.join(dir, 'index.html'))
}

app.whenReady().then(createMain)
app.on('window-all-closed', () => app.quit())
