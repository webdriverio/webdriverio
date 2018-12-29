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
        ): object;
        getHTML(
            includeSelectorTag?: boolean
        ): string;
        getLocation(
            prop: string
        ): object | number;
        getProperty(
            property: string
        ): object | string;
        getSize(
            prop: string
        ): object | number;
        getTagName(): string;
        getText(): string;
        getValue(): string | string[];
        isDisplayed(): boolean;
        isDisplayedInViewport(): boolean | boolean[];
        isEnabled(): boolean;
        isExisting(): boolean | boolean[];
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
        call(
            callback: Function
        ): undefined;
        debug(): undefined;
        deleteCookies(
            name?: string[]
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
        ): object[];
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
            filename: string
        ): Buffer;
        setCookies(
            cookie: object
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