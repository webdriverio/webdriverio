class TestOpsConfig {
    private static _instance: TestOpsConfig
    public buildStopped: boolean = false
    public buildHashedId?: string

    static getInstance(...args: unknown[]) {
        if (!this._instance) {
            // @ts-expect-error passing args to constructor
            this._instance = new TestOpsConfig(...args)
        }
        return this._instance
    }

    constructor(
        public enabled: boolean = true,
        public manuallySet: boolean = false,
    ){
        TestOpsConfig._instance = this
    }
}

export default TestOpsConfig
