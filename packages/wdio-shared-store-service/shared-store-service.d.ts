declare namespace WebdriverIO {
    interface Browser {
        sharedStore: {
            get: (key: string) => JsonPrimitive | JsonCompatible;
            set: (key: string, value: JsonPrimitive | JsonCompatible) => void;
        }
    }
}
