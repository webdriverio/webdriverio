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
        public enabled?: boolean,
        public manuallySet: boolean = false,
    ){

    }
}

export default TestOpsConfig
