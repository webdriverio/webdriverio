declare module "css-value" {
    declare const cssValue: {
        (rgb: string): CSSValue[]
    }

    namespace cssValue {
        interface CSSValue {
            type: string
            string: string
            unit: string
            value: any
        }
    }

    export = cssValue
}
