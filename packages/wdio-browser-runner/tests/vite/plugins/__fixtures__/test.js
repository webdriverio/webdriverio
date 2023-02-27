/* eslint-disable */
import React, { FC } from 'react'
import { expect, $ } from '@wdio/globals'
import { spyOn, mock, unmock as foobar, fn } from '@wdio/browser-runner'
import { html, render } from 'lit'
import * as matchers from '@testing-library/jest-dom/matchers'

import defaultExport, { namedExportValue } from 'someModule'

import { SimpleGreeting } from './components/LitComponent.ts'

const getQuestionFn = spyOn(SimpleGreeting.prototype, 'getQuestion')
mock('./components/constants.ts', async (getOrigModule) => {
    const mod = await getOrigModule()
    return {
        GREETING: mod.GREETING + ' Sir'
    }
})

mock('graphql-request', () => ({
    gql: fn(),
    GraphQLClient: class GraphQLClientMock {
        request = fn().mockResolvedValue({ result: 'Thanks for your answer!' })
    }
}))
mock('foobar')

foobar('hello')

describe('Some test', () => {
    it('should tests something', async () => {
        // ...
    })
})
