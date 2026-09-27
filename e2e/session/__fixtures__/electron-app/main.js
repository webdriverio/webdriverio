const path = require('node:path')
const { app, BrowserWindow } = require('electron')

if (process.argv.includes('--version-check')) {
    console.log(`electron ${process.versions.electron}`)
    app.exit(0)
}

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { contextIsolation: true }
    })
    win.loadFile(path.join(__dirname, 'index.html'))
    console.log('main ready')
})

app.on('window-all-closed', () => app.quit())
