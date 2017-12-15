export default function run (wdioConf, params) {
    let stdinData = ''

    /**
     * if stdin.isTTY, then no piped input is present and launcher should be
     * called immediately, otherwise piped input is processed, expecting
     * a list of files to process.
     *
     * stdin.isTTY is false when command is from nodes spawn since it's treated as a pipe
     */
    if (process.stdin.isTTY || !process.stdout.isTTY) {
        return launch(wdioConf, params)
    }

    /*
     * get a list of spec files to run from stdin, overriding any other
     * configuration suite or specs.
     */
    const stdin = process.openStdin()
    stdin.setEncoding('utf8')
    stdin.on('data', (data) => {
        stdinData += data
    })
    stdin.on('end', () => {
        if (stdinData.length > 0) {
            params.specs = stdinData.trim().split(/\r?\n/)
        }
        launch(wdioConf, params)
    })
}

function launch (wdioConf, params) {
    console.log('Run suite with config', wdioConf, 'and params', params) // eslint-disable-line no-console
    // let launcher = new Launcher(wdioConf, params)
    // launcher.run().then(
    //     (code) => process.exit(code),
    //     (e) => process.nextTick(() => { throw e }))
}
