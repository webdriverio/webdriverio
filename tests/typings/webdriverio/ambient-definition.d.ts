declare namespace WebdriverIO {
    interface Browser {
        ambientCommand: (arg: any) => Promise<number>
    }
}
