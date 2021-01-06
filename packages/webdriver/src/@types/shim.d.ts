declare module '@wdio/config' {
    type DefaultOptions<T> = {
        [k in keyof T]?: {
            type: 'string' | 'number' | 'object' | 'boolean' | 'function';
            default?: T[k];
            required?: boolean;
            validate?: (option: T[k]) => void;
            match?: RegExp;
        };
    };
    let validateConfig: Function
}
declare module '@wdio/utils' {
    let webdriverMonad: Function
    let sessionEnvironmentDetector: Function
    let getArgumentType: Function
    let isValidParameter: Function
    let commandCallStructure: Function
    let transformCommandLogResult: Function
}
