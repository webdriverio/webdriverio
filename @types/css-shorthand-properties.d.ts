declare module "css-shorthand-properties" {
    const cssShortHand: {
        /**
         * Returns a boolean indicating if a CSS property is a shorthand.
         */
        isShorthand: (property: string) => boolean
        /**
         * Takes a CSS shorthand property and returns a list of longhand properties.
         */
        expand: (property: string, recurse?: boolean) => string[]
    }

    export = cssShortHand
}
