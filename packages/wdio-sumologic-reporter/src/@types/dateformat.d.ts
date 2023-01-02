declare module 'dateformat' {
    /**
     * @param date Defaults to the current date/time.
     * @param mask Defaults to `masks.default`.
     * @returns A formatted version of the given date.
     */
    export default function dateFormat(date?: Date | string | number, mask?: string, utc?: boolean, gmt?: boolean): string;
    export default function dateFormat(mask?: string, utc?: boolean, gmt?: boolean): string;
}
