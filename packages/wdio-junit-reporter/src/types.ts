import { WDIOReporterOptionsFromLogFile } from '@wdio/reporter'

export interface Data {
    type: any
    method: string
    endpoint: string
    sessionId: any
    body: string
    command: any
    params: string
}

export interface JunitReporterOptions extends WDIOReporterOptionsFromLogFile {
    configFile: string
    logLevel: string
    stdout?: boolean
    suiteNameFormat?: RegExp
    packageName?: string
    addFileAttribute?: any
    errorOptions?: any
}
