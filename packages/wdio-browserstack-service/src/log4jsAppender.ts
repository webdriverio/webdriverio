import logReportingAPI from './logReportingAPI.js'

const BSTestOpsLogger = new logReportingAPI({})

//Disabling eslint here as there params can be used later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BSTestOpsLog4JSAppender(layout: Function, timezoneOffset: unknown): Function {
    return (loggingEvent: { level?: { levelStr: string }, data: string[] }) => {
        BSTestOpsLogger.log({
            level: loggingEvent.level ? loggingEvent.level.levelStr : null,
            message: loggingEvent.data ? loggingEvent.data.join(' ') : null
        })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const configure = (config: { timezoneOffset: string, layout: { type: string } }, layouts: any): Function => {
    let layout = layouts.colouredLayout
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout)
    }
    return BSTestOpsLog4JSAppender(layout, config.timezoneOffset)
}
