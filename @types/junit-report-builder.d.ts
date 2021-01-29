declare module "junit-report-builder" {
    interface Builder {
        build: () => void
    }

    declare const cssValue: {
        newBuilder: () => Builder
    }

    export = cssValue
}
