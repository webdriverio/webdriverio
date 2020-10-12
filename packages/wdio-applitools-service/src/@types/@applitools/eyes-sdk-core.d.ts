declare module '@applitools/eyes-sdk-core';

interface ProxySettings {
    new(uri: string | boolean, username: string, password: string, isHttpOnly: boolean): ProxySettings;
}
