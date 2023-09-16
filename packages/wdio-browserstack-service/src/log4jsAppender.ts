import logReportingAPI from './logReportingAPI.js'

const BSTestOpsLogger = new logReportingAPI({})

//Disabling eslint here as there params can be used later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BSTestOpsLog4JSAppender(layout: Function, timezoneOffset: any): Function {
    return (loggingEvent: any) => {
        BSTestOpsLogger.log({
            level: loggingEvent.level ? loggingEvent.level.levelStr : null,
            message: loggingEvent.data ? loggingEvent.data.join(' ') : null
        })
    }
}

export const configure = (config: any, layouts: any): Function => {
    let layout = layouts.colouredLayout
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout)
    }
    return BSTestOpsLog4JSAppender(layout, config.timezoneOffset)
}
