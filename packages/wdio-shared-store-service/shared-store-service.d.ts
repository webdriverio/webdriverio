type jsonPrimitive = string | number | boolean | null;
type jsonObject = { [x: string]: jsonPrimitive | jsonObject | jsonArray };
type jsonArray = Array<jsonPrimitive | jsonObject | jsonArrayWorkaround>;
type jsonCompatible = jsonPrimitive | jsonObject | jsonArray;

/**
 * circular reference workaround until TypeScript 3.7
 * https://github.com/microsoft/TypeScript/pull/33050
 * `jsonArray` should repplace `jsonArrayWorkaround` in `jsonArray` array types
 * and interface below can be removed
 */
interface jsonArrayWorkaround extends Array<jsonPrimitive | jsonObject | jsonArray> { }

declare namespace WebdriverIO {
    interface BrowserObject {
        sharedStore: {
            get: (key: string) => jsonCompatible;
            set: (key: string, value: jsonCompatible) => void;
        }
    }
}
