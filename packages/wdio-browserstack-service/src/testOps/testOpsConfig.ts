class TestOpsConfig {
    private static _instance: TestOpsConfig
    public buildStopped: boolean = false
    public buildHashedId?: string

    static getInstance(...args: any[]) {
        if (!this._instance) {
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
