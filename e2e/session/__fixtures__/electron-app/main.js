const path = require('node:path')
const { app, BrowserWindow } = require('electron')

if (process.argv.includes('--version-check')) {
    console.log(`electron ${process.versions.electron}`)
    app.exit(0)
}

app.setName('session-fixture-app')

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { contextIsolation: true }
    })
    win.loadFile(path.join(__dirname, 'index.html'))
    /**
     * Main-process capture attaches after the WebDriver session is up, so a
     * log emitted only during startup is missed. Keep emitting until close.
     */
    console.log('main ready')
    setInterval(() => console.log('main ready'), 400)
})

app.on('window-all-closed', () => app.quit())
