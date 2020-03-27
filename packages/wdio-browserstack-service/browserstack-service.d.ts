declare module WebdriverIO {
    interface ServiceOption extends BrowserstackConfig {}
}

interface BrowserstackConfig {
    /**
     * Set this to true to enable routing connections from Browserstack cloud through your computer.
     * You will also need to set `browserstack.local` to true in browser capabilities.
     */
    browserstackLocal?: boolean;
    /**
     * Set this to true to kill the browserstack process on complete, without waiting for the
     * browserstack stop callback to be called. This is experimental and should not be used by all.
     */
    forcedStop?: boolean;
    /**
     * Specified optional will be passed down to BrowserstackLocal. See this list for details:
     * https://stackoverflow.com/questions/39040108/import-class-in-definition-file-d-ts
     */
    opts?: Partial<import('browserstack-local').Options>
}
