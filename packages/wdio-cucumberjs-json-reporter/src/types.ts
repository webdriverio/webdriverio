import type { Reporters } from '@wdio/types'
import type { Argument, Tag } from '@wdio/reporter'

export interface CucumberJsJsonReporterInterface extends Reporters.Options {
    jsonFolder?: string;
    language?: string;
    disableHooks?: boolean;
    /**
     * a JSON file for each try of a retried spec (`true`), or the tries in one file (`false`)
     * @default true
     */
    reportFilePerRetry?: boolean;
}

export interface BrowserData {
    browser: {
        name: string;
        version: string;
    };
}

export interface AppData {
    app?: {
        name: string;
        version: string;
    };
}

export interface MetadataObject {
    app?: {
        name: string;
        version: string;
    };
    browser?: {
        name: string;
        version: string;
    };
    device?: string;
    platform?: {
        name: string;
        version: string;
    };
    keyword?: string;
    type?: string;
}

export interface Report {
    /** the feature that runs now */
    feature: Feature;
    /** all features of the worker (a worker can run several feature files) */
    features?: Feature[];
}

export interface FeatureMetadata {
    keyword: string;
    type: string;
}

export interface Feature {
    report?: {
        keyword: string;
    };
    keyword?: string;
    type?: string;
    metadata?: MetadataObject;
    description?: string;
    line?: number | null;
    name?: string;
    uri?: string;
    tags?: string[] | Tag[] | string;
    elements?: Scenario[];
    id?: string;
}

export interface Scenario {
    keyword?: string;
    type?: string;
    description?: string;
    name?: string;
    tags?: string[] | Tag[] | string;
    id?: string;
    line?: number | null;
    steps?: Step[];
}

export interface Step {
    arguments?: ( string | Argument | DocString )[];
    keyword?: string;
    name?: string;
    result?: {
        status: string;
        duration: number;
        error_message?: string;
    };
    line?: number | null;
    /** `true` for a hook (Cucumber JSON format) */
    hidden?: boolean;
    match?: {
        location: number | string;
    };
    embeddings?: Embedding[];
}

export interface Result extends ErrorMessage {
    status: string;
    duration: number;
}

export type AttachmentType = 'application/json' | 'image/png' | 'text/plain'
export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | JSONValue[]
export type CucumberAttachmentData = string | { [x: string]: JSONValue }

export interface CucumberJsAttachment {
    data: CucumberAttachmentData;
    type: AttachmentType;
}

export interface Embedding {
    data: string | { [x: string]: JSONValue };
    mime_type: AttachmentType;
}

export interface ErrorMessage {
    error_message?: string;
}

export interface cjson_metadata {
    browser?: {
        name: string;
        version: string;
    };
    device?: string;
    app?: {
        name: string;
        version: string;
    };
    platform?: {
        name: string;
        version: string;
    };
}

declare global {
    namespace WebdriverIO {
        interface Capabilities {
            /** the metadata of the CucumberJS JSON report (`@wdio/cucumberjs-json-reporter`) */
            'cjson:metadata'?: cjson_metadata
        }
    }
}

/**
 * A doc string argument in the Cucumber JSON format
 */
export interface DocString {
    content: string;
    line?: number;
}
