/// <reference types="node"/>
/// <reference types="webdriver"/>

declare namespace WebdriverIO {
    function remote(
        options: any,
        modifier: any
    ): WebDriver.Client<void>;

    function multiremote(
        options: any
    ): WebDriver.Client<void>;

    type LocationParam = 'x' | 'y';

    interface LocationReturn {
        x: number,
        y: number
    }

    type SizeParam = 'width' | 'height';

    interface SizeReturn {
        width: number,
        height: number
    }

    interface Cookie {
        name: string,
        value: string,
        path?: string,
        expiry?: number,
    }

    interface Cookie {
        name: string,
        value: string,
        domain?: string
        path?: string,
        expiry?: number,
        isSecure?: boolean,
        isHttpOnly?: boolean
    }

    interface CSSProperty {
        property: string,
        value: any,
        parse: {
            type: string,
            string: string,
            unit: string,
            value: any
        }
    }

    interface Element<T> {
        addValue(
            value: any
        ): undefined;
        clearValue(): undefined;
        click(): undefined;
        doubleClick(): undefined;
        dragAndDrop(
            target: Element<void>,
            duration: number
        ): undefined;
        getAttribute(
            attributeName: string
        ): string;
        getCSSProperty(
            cssProperty: string
        ): CSSProperty;
        getHTML(
            includeSelectorTag?: boolean
        ): string;
        getLocation(
            prop: LocationParam
        ): number;
        getLocation(): LocationReturn;
        getProperty(
            property: string
        ): object | string;
        getSize(
            prop: SizeParam
        ): number;
        getSize(): SizeReturn;
        getTagName(): string;
        getText(): string;
        getValue(): string;
        isDisplayed(): boolean;
        isDisplayedInViewport(): boolean;
        isEnabled(): boolean;
        isExisting(): boolean;
        isFocused(): boolean;
        isSelected(): boolean;
        moveTo(
            xoffset: number,
            yoffset: number
        ): undefined;
        saveScreenshot(
            filename: string
        ): Buffer;
        scrollIntoView(): undefined;
        selectByAttribute(
            attribute: string,
            value: string
        ): undefined;
        selectByIndex(
            index: number
        ): undefined;
        selectByVisibleText(
            text: string
        ): undefined;
        setValue(
            value: any
        ): undefined;
        touchAction(
            action: string | object[]
        ): undefined;
        waitForDisplayed(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): undefined;
        waitForEnabled(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): undefined;
        waitForExist(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): undefined;
    }

    interface Browser<T> {
        addCommand(
            name: string,
            func: Function
        ): any;
        waitUntil(
            condition: Function,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): undefined
        call(
            callback: Function
        ): undefined;
        debug(): undefined;
        deleteCookies(
            names?: string[]
        ): undefined;
        execute(
            script: string | Function
        ): undefined;
        executeAsync(
            script: string | Function,
            arguments: any
        ): undefined;
        getCookies(
            names?: string[]
        ): Cookie[];
        keys(
            value: string | string[]
        ): undefined;
        newWindow(
            url: string,
            windowName: string,
            windowFeatures: string
        ): string;
        pause(
            milliseconds: number
        ): undefined;
        reloadSession(): undefined;
        saveScreenshot(
            filepath: string
        ): Buffer;
        setCookies(
            cookie: Cookie
        ): undefined;
        switchWindow(
            urlOrTitleToMatch: string | RegExp
        ): undefined;
        touchAction(
            action: string | object[]
        ): undefined;
        url(
            url?: string
        ): string;
    }
}

declare var browser: WebDriver.Client<void> & WebdriverIO.Browser<void>;
declare function $(selector: string): WebdriverIO.Element<void>;
declare function $$(selector: string): WebdriverIO.Element<void>[];

declare module "webdriverio" {
    export = WebdriverIO
}