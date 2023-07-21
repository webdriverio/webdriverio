declare module "junit-report-builder" {
    interface Builder {
        build: () => void
    }

    const cssValue: {
        newBuilder: () => Builder
    }

    export = cssValue
}
