import type { local } from 'webdriver'
import type { Cookie } from '@wdio/protocols'

export type MockFilterOptions = {
    method?: string | ((method: string) => boolean)
    requestHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    responseHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    statusCode?: number | ((statusCode: number) => boolean)
}

type Overwrite <T, Request> = T | ((request: Request) => T)
type Methods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD'

interface BaseOverwriteOptions<Request> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: Overwrite<any, Request>
    cookies?: Overwrite<Cookie[], Request>
    headers?: Overwrite<Record<string, string>, Request>
}

export interface RequestWithOptions extends BaseOverwriteOptions<local.NetworkBeforeRequestSentParameters> {
    method?: Overwrite<Methods, local.NetworkBeforeRequestSentParameters>
    url?: Overwrite<string, local.NetworkBeforeRequestSentParameters>
}

export interface RespondWithOptions extends BaseOverwriteOptions<local.NetworkResponseCompletedParameters> {
    statusCode?: Overwrite<number, local.NetworkResponseCompletedParameters>
}

export interface MockRequestOptions {
    requestWith?: RequestWithOptions
}
