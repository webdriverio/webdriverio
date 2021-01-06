declare module 'webdriverio' {
    interface MultiRemoteBrowserOptions {
        sessionId?: string
        capabilities: any
    }
    interface HookFunctions {
        before?(...args: any): any
        beforeSession?(...args: any): any
        beforeSuite?(...args: any): any
        beforeHook?(...args: any): any
        beforeTest?(...args: any): any
        beforeCommand?(...args: any): any
        afterCommand?(...args: any): any
        afterTest?(...args: any): any
        afterHook?(...args: any): any
        afterSuite?(...args: any): any
        afterSession?(...args: any): any
        after?(...args: any): any
        beforeFeature?(...args: any): any
        beforeScenario?(...args: any): any
        beforeStep?(...args: any): any
        afterStep?(...args: any): any
        afterScenario?(...args: any): any
        afterFeature?(...args: any): any
        onReload?(...args: any): any
        onPrepare?(...args: any): any
        onWorkerStart?(...args: any): any
        onComplete?(...args: any): any
    }
    interface MultiRemoteCapabilities {}
    interface Config {}
    interface Hooks {}
}
