/**
 * Represents a primitive type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-PrimitiveProtocolValue.
 */
export enum PrimitiveType {
    Undefined = 'undefined',
    Null = 'null',
    String = 'string',
    Number = 'number',
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    SpecialNumber = 'number',
    Boolean = 'boolean',
    BigInt = 'bigint'
}

/**
 * Represents a non-primitive type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-RemoteValue.
 */
export enum NonPrimitiveType {
    Array = 'array',
    Date = 'date',
    Map = 'map',
    Object = 'object',
    RegularExpression = 'regexp',
    Set = 'set',
    Channel = 'channel'
}

/**
 * Represents a remote value type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-RemoteValue.
 */
export enum RemoteType {
    Symbol = 'symbol',
    Function = 'function',
    WeakMap = 'weakmap',
    WeakSet = 'weakset',
    Iterator = 'iterator',
    Generator = 'generator',
    Error = 'error',
    Proxy = 'proxy',
    Promise = 'promise',
    TypedArray = 'typedarray',
    ArrayBuffer = 'arraybuffer',
    NodeList = 'nodelist',
    HTMLCollection = 'htmlcollection',
    Node = 'node',
    Window = 'window'
}

/**
 * Represents a speacial number type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-PrimitiveProtocolValue.
 */
export enum SpecialNumberType {
    NaN = 'NaN',
    MinusZero = '-0',
    Infinity = 'Infinity',
    MinusInfinity = '-Infinity'
}

/**
 * Represents the type of script evaluation result.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-EvaluateResult.
 */
export enum EvaluateResultType {
    Success = 'success',
    Exception = 'exception'
}
