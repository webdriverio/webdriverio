export default function debug () {
    return new Promise((resolve) => {
        console.log('%cDebug Mode Enabled', 'background: #ea5906; color: #fff; padding: 3px; border-radius: 5px;', 'enter the command `wdioDebugContinue()` in the console to continue')
        window.wdioDebugContinue = resolve
    })
}
