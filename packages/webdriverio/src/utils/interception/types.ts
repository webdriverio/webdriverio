import type { local } from 'webdriver'
import type { Cookie } from '@wdio/protocols'

export type MockFilterOptions = {
    method?: string | ((method: string) => boolean)
    headers?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    requestHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    responseHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    statusCode?: number | ((statusCode: number) => boolean)
    postData?: string | ((payload: string | undefined) => boolean)
}

type Overwrite <T, Request> = T | ((request: Request) => T)
type Methods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD'

export interface RequestWithOptions {
    body?: Overwrite<any, local.NetworkBeforeRequestSentParameters>
    cookies?: Overwrite<Cookie[], local.NetworkBeforeRequestSentParameters>
    headers?: Overwrite<Record<string, string>, local.NetworkBeforeRequestSentParameters>
    method?: Overwrite<Methods, local.NetworkBeforeRequestSentParameters>
    url?: Overwrite<string, local.NetworkBeforeRequestSentParameters>
}

export interface RespondWithOptions extends Omit<RequestWithOptions, 'url' | 'method'> {
    statusCode?: Overwrite<number, local.NetworkResponseCompletedParameters>
}

export interface MockRequestOptions {
    requestWith?: RequestWithOptions
}

export type MockOptions = MockFilterOptions & MockRequestOptions
