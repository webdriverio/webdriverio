/**
 * A polyfill to set `__name` to the global scope which is needed for WebdriverIO to properly
 * execute custom (preload) scripts. When using `tsx` Esbuild runs some optimizations which
 * assume that the file contains these global variables. This is a workaround until this issue
 * is fixed.
 *
 * @see https://github.com/evanw/esbuild/issues/2605
 */
export const polyfillFn = function webdriverioPolyfill() {
    // eslint-disable-next-line no-var
    var __defProp = Object.defineProperty
    // eslint-disable-next-line no-var
    var __name = function (target: unknown, _value: unknown) {
        return __defProp(target, 'name', { value: _value, configurable: true })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-var
    var __globalThis = (typeof globalThis === 'object' && globalThis) || (typeof window === 'object' && window) as any
    __globalThis.__name = __name
}
