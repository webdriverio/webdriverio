declare namespace WebdriverIO {
    interface BrowserObject {
        sharedStore: {
            get: (key: string) => JsonPrimitive | JsonCompatible;
            set: (key: string, value: JsonPrimitive | JsonCompatible) => void;
        }
    }
}
