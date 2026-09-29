/**
 * The global `expect` of `@wdio/jasmine-framework` keeps Jasmine sync matchers
 * sync and sends WebdriverIO and Jasmine async matchers to `expectAsync`.
 */
type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false
function assertType<T extends true>(_: T) {}

const spy = jasmine.createSpy('spy')
declare const elements: WebdriverIO.Element[]

/**
 * Jasmine sync matchers return void
 */
assertType<Equals<ReturnType<typeof syncMatchers>, void[]>>(true)
function syncMatchers () {
    return [
        expect(1).toBe(1),
        expect(1).not.toBe(2),
        expect(1).withContext('context').toBe(1),
        expect('abc').toContain('b'),
        expect([1, 2]).toHaveSize(2),
        expect([]).toHaveSize(0),
        expect('abc').toHaveSize(3),
        expect(spy).toHaveBeenCalled(),
        expect({ a: 'x' }).toEqual(jasmine.objectContaining({ a: 'x' })),
        expect({ a: 'x' }).toEqual(expect.objectContaining({ a: expect.stringMatching(/x/) }))
    ]
}

/**
 * WebdriverIO matchers return a Promise
 */
assertType<Equals<ReturnType<typeof wdioMatchers>, Promise<void>[]>>(true)
function wdioMatchers () {
    return [
        expect($('foo')).toHaveText('bar'),
        expect($('foo')).not.toBeDisplayed(),
        expect($('foo')).toHaveSize({ width: 1, height: 1 }),
        expect(elements).toHaveSize({ width: 1, height: 1 }),
        expect(elements).toHaveText('bar'),
        expect($('foo')).toHaveText(expect.not.stringContaining('baz')),
        expect($$('foo')).toBeElementsArrayOfSize(2),
        expect(browser).withContext('context').toHaveTitle(expect.stringContaining('bar'))
    ]
}

/**
 * Jasmine async matchers are available for promises
 */
assertType<Equals<ReturnType<typeof jasmineAsyncMatchers>, PromiseLike<void>[]>>(true)
function jasmineAsyncMatchers () {
    return [
        expect(Promise.resolve(1)).toBeResolved(),
        expect(Promise.resolve(1)).toBeResolvedTo(1),
        expect(Promise.reject(new Error('boom'))).toBeRejectedWithError(Error)
    ]
}

/**
 * Matchers are not available for actual values that they do not accept
 */
// @ts-expect-error WebdriverIO element matcher on a number
expect(1).toHaveText('foo')
// @ts-expect-error WebdriverIO toHaveSize on an array
expect([1, 2]).toHaveSize({ width: 1 })
// @ts-expect-error Jasmine async matcher on a value that is not a promise
expect(1).toBeResolved()
// @ts-expect-error Jest matcher that Jasmine does not have
expect(1).toStrictEqual(1)
