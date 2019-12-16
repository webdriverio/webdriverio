type jsonPrimitive = string | number | boolean | null;
type jsonObject = { [x: string]: jsonPrimitive | jsonObject | jsonArray };
type jsonArray = Array<jsonPrimitive | jsonObject | jsonArray>;
type jsonCompatible = jsonPrimitive | jsonObject | jsonArray;

declare namespace WebdriverIO {
    interface BrowserObject {
        sharedStore: {
            get: (key: string) => jsonCompatible;
            set: (key: string, value: jsonCompatible) => void;
        }
    }
}
