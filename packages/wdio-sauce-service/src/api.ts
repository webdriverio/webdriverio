import * as util from 'node:util'
import logger from '@wdio/logger'
import type { AxiosInstance } from 'axios'
import axios, { isAxiosError } from 'axios'

import type { Region, TestRunRequestBody, HTTPValidationError } from './types.js'
import { apiURLMap } from './types.js'

const log = logger('@wdio/sauce-service')

export class TestRuns {
    private api: AxiosInstance

    constructor(opts: { username: string; accessKey: string; region: Region }) {
        this.api = axios.create({
            auth: {
                username: opts.username,
                password: opts.accessKey,
            },
            baseURL: apiURLMap.get(opts.region),
        })
    }

    async create(testRuns: TestRunRequestBody[]) {
        try {
            log.debug('Submitting test run to test-runs api', testRuns)
            await this.api.post<void>('/test-runs/v1/', {
                test_runs: testRuns,
            })
        } catch (e: unknown) {
            if (isAxiosError(e)) {
                let data
                switch (e.response?.status) {
                case 422:
                    data = e.response?.data as HTTPValidationError
                    log.debug(
                        'Failed to report test run data',
                        util.inspect(data, { depth: null }),
                    )
                    break
                default:
                    log.debug(
                        'Unexpected http error while reporting test run data: %s',
                        e.message,
                    )
                }
            } else {
                log.debug('Unexpected error while reporting test run data', e)
            }
        }
    }
}
