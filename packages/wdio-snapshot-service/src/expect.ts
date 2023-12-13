/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect } from 'expect-webdriverio'
import {
    addSerializer,
    // toMatchInlineSnapshot,
    // toMatchSnapshot,
    toThrowErrorMatchingInlineSnapshot,
    toThrowErrorMatchingSnapshot,
} from 'jest-snapshot'

import {
    toMatchElementInlineSnapshot,
    toMatchElementSnapshot,
    toMatchInlineSnapshot,
    toMatchSnapshot
} from './matchers/index.js'

import type { JestExpect } from './types.js'

export type {
    AsymmetricMatchers,
    Matchers,
    MatcherContext,
    MatcherFunction,
    MatcherFunctionWithContext,
    MatcherState,
    MatcherUtils,
} from 'expect'

export type { JestExpect } from './types.js'

function createJestExpect(): JestExpect {
    (expect as any).extend({
        toMatchElementInlineSnapshot,
        toMatchElementSnapshot,
        toMatchInlineSnapshot,
        toMatchSnapshot,
        toThrowErrorMatchingInlineSnapshot,
        toThrowErrorMatchingSnapshot,
    });

    (expect as any).addSnapshotSerializer = addSerializer

    return expect as any as JestExpect
}

export const jestExpect = createJestExpect()
