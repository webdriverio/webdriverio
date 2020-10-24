export const STATIC_RETURNS: { [type: string]: string } = {
    driver: '[WebdriverIO REPL client]',
    browser: '[WebdriverIO REPL client]',
    $: '[Function: findElement]',
    $$: '[Function: findElements]'
}

export const INTRO_MESSAGE = `
The execution has stopped!
You can now go into the browser or use the command line as REPL
(To exit, press ^C again or type .exit)
`

export const DEFAULT_CONFIG = {
    commandTimeout: 5000,
    prompt: '\u203A ',
    useGlobal: true,
    useColor: true
}
