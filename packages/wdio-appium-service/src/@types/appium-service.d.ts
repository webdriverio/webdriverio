
type ArgValue = string | number | boolean | null

type AppiumCapability = {
    [capability: string]: any
}

type KeyValueArgs = {
    [key: string]: ArgValue
}

type Config = {
    outputDir?: string
    [key: string]: any
}

type AppiumOptions = {
    command: string
    logPath: string
    args: KeyValueArgs | ArgValue[]
}
