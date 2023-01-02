declare module 'validator/es/index.js' {
    interface IsBase64Options {
        /**
         * @default false
         */
        urlSafe?: boolean | undefined
    }
    /**
     * Check if a string is base64 encoded.
     *
     * @param [options] - Options
     */
    export function isBase64(str: string, options?: IsBase64Options): boolean
}
