import { some } from 'expect-webdriverio/api'

/**
 * The global `expect` keeps Jasmine sync matchers sync, and sends WebdriverIO
 * matchers and Jasmine async matchers to `expectAsync`.
 */
const page = 'data:text/html,' + encodeURIComponent(`
    <title>Jasmine Page</title>
    <h1 id="heading">Hello Jasmine</h1>
    <div id="box" style="display: block; width: 120px; height: 40px"></div>
    <ul><li class="item" data-state="on">a</li><li class="item" data-state="off">b</li></ul>
`)

type AddExpectationResult = (this: unknown, passed: boolean, data: { message?: string }, ...rest: unknown[]) => unknown
type JasmineSpec = { prototype: { addExpectationResult: AddExpectationResult } }

/**
 * Run `assertion` and return the messages of its failed expectations. The
 * failures are not recorded, so the spec does not fail. Jasmine 6 keeps
 * `Spec` on `jasmine.private`, as the adapter does.
 */
async function failuresOf (assertion: () => unknown) {
    const internals = jasmine as unknown as { private?: { Spec: JasmineSpec }, Spec?: JasmineSpec }
    const Spec = (internals.private?.Spec ?? internals.Spec)!
    const addExpectationResult = Spec.prototype.addExpectationResult
    const messages: string[] = []
    Spec.prototype.addExpectationResult = function (passed, data, ...rest) {
        if (passed) {
            return addExpectationResult.call(this, passed, data, ...rest)
        }
        messages.push(data.message ?? '')
    }
    try {
        await assertion()
    } finally {
        Spec.prototype.addExpectationResult = addExpectationResult
    }
    return messages
}

describe('Jasmine expect', () => {
    beforeAll(async () => {
        await browser.url(page)
    })

    it('keeps Jasmine sync matchers synchronous', () => {
        expect(expect(1).toBe(1)).toBeUndefined()
        expect(expect(1).not.toBe(2)).toBeUndefined()
        expect(expect(1).withContext('context').toBe(1)).toBeUndefined()
        expect(expect([1, 2]).toHaveSize(2)).toBeUndefined()
        expect(expect([]).toHaveSize(0)).toBeUndefined()
        expect(expect({ selector: '#item', length: 2 }).toHaveSize(2)).toBeUndefined()
        expect(expect({ a: 'x' }).toEqual(expect.objectContaining({ a: 'x' }))).toBeUndefined()
    })

    it('runs Jasmine spy matchers', () => {
        const spy = jasmine.createSpy('spy')
        spy('foo')
        expect(spy).toHaveBeenCalled()
        expect(spy).toHaveBeenCalledOnceWith('foo')
    })

    it('runs WebdriverIO matchers', async () => {
        await expect(browser).toHaveTitle('Jasmine Page')
        await expect(browser).toHaveTitle(expect.stringContaining('Jasmine'))
        await expect($('#heading')).toHaveText('Hello Jasmine')
        await expect($('#heading')).toHaveText(expect.oneOf('Hello Jasmine', 'Hello Mocha'))
        await expect($('#heading')).not.toHaveText('Goodbye')
        await expect($('#heading')).withContext('heading').toBeDisplayed()
        await expect($$('.item')).toBeElementsArrayOfSize(2)
    })

    it('uses the WebdriverIO toHaveSize for elements', async () => {
        await expect($('#box')).toHaveSize({ width: 120, height: 40 })
        await expect(await $('#box')).toHaveSize({ width: 120, height: 40 })
        await expect(await $$('#box')).toHaveSize({ width: 120, height: 40 })
        await expect(await $$('#box').filter(() => true)).toHaveSize({ width: 120, height: 40 })
    })

    it('runs Jasmine async matchers', async () => {
        await expect(Promise.resolve(1)).toBeResolvedTo(1)
        await expectAsync(Promise.reject(new Error('boom'))).toBeRejectedWithError('boom')
    })

    it('supports Jasmine asymmetric matchers in Jasmine matchers', () => {
        expect(1).toEqual(jasmine.any(Number))
        expect({ a: 0 }).toEqual({ a: jasmine.anything() })
        expect({ a: 1, b: 2 }).toEqual(jasmine.objectContaining({ a: 1 }))
        expect([1, 2, 3]).toEqual(jasmine.arrayContaining([3, 1]))
        expect([1, 2]).toEqual(jasmine.arrayWithExactContents([2, 1]))
        expect('Hello Jasmine').toEqual(jasmine.stringContaining('Jasmine'))
        expect('Hello Jasmine').toEqual(jasmine.stringMatching(/^Hello/))
        expect(new Map([['a', 1], ['b', 2]])).toEqual(jasmine.mapContaining(new Map([['a', 1]])))
        expect(new Set([1, 2])).toEqual(jasmine.setContaining(new Set([2])))
        expect(1).toEqual(jasmine.truthy())
        expect(0).toEqual(jasmine.falsy())
        expect([]).toEqual(jasmine.empty())
        expect([1]).toEqual(jasmine.notEmpty())

        const spy = jasmine.createSpy('spy')
        spy('foo', { id: 1 })
        expect(spy).toHaveBeenCalledWith(jasmine.any(String), jasmine.objectContaining({ id: 1 }))
    })

    it('supports Jasmine asymmetric matchers in WebdriverIO matchers', async () => {
        await expect(browser).toHaveTitle(jasmine.stringMatching(/^Jasmine/))
        await expect($('#heading')).toHaveText(jasmine.stringContaining('Jasmine'))
        await expect($('#heading')).toHaveText(jasmine.any(String))
        await expect($('#heading')).toHaveAttribute('id', jasmine.anything())
        await expect($('#heading')).not.toHaveText(jasmine.stringContaining('Mocha'))
    })

    it('supports some() with WebdriverIO matchers', async () => {
        await expect(some($$('.item'))).toHaveAttribute('data-state', 'on')
        await expect(some($$('.item'))).toHaveAttribute('data-state', jasmine.stringMatching(/^of/))
        await expect(some($$('.item'))).not.toHaveAttribute('data-state', 'on')
        await expect(some($$('#box'))).toHaveSize({ width: 120, height: 40 })
    })

    describe('failure messages', () => {
        it('reports Jasmine sync matcher failures', async () => {
            expect(await failuresOf(() => expect('x').toEqual(jasmine.any(Number))))
                .toEqual(['Expected \'x\' to equal <jasmine.any(Number)>.'])
            expect(await failuresOf(() => expect({ a: 1 }).toEqual(jasmine.objectContaining({ a: 2 }))))
                .toEqual(['Expected $.a = 1 to equal 2.'])
            expect(await failuresOf(() => expect([1]).toHaveSize(2)))
                .toEqual(['Expected [ 1 ] with size 1 to have size 2.'])
            expect(await failuresOf(() => expect(1).withContext('number').toBe(2)))
                .toEqual(['number: Expected 1 to be 2.'])

            const spy = jasmine.createSpy('spy')
            spy('foo', { id: 1 })
            expect(await failuresOf(() => expect(spy).toHaveBeenCalledWith(jasmine.any(String), jasmine.objectContaining({ id: 2 }))))
                .toEqual([[
                    'Expected spy spy to have been called with:',
                    '  [ <jasmine.any(String)>, <jasmine.objectContaining(Object({ id: 2 }))> ]',
                    'but actual calls were:',
                    '  [ \'foo\', Object({ id: 1 }) ].',
                    '',
                    'Call 0:',
                    '  Expected $[1].id = 1 to equal 2.'
                ].join('\n')])
        })

        it('reports WebdriverIO matcher failures', async () => {
            expect(await failuresOf(() => expect($('#heading')).toHaveText('Goodbye', { wait: 0 })))
                .toEqual([[
                    'Expect $(`#heading`) to have text',
                    '',
                    'Expected: "Goodbye"',
                    'Received: "Hello Jasmine"'
                ].join('\n')])
            expect(await failuresOf(() => expect($('#heading')).not.toHaveText('Hello Jasmine', { wait: 0 })))
                .toEqual([[
                    'Expect $(`#heading`) not to have text',
                    '',
                    'Expected [not]: "Hello Jasmine"',
                    'Received      : "Hello Jasmine"'
                ].join('\n')])
            expect(await failuresOf(() => expect($('#heading')).withContext('heading').toHaveText('Goodbye', { wait: 0 })))
                .toEqual([[
                    'heading:',
                    '    Expect $(`#heading`) to have text',
                    '    ',
                    '    Expected: "Goodbye"',
                    '    Received: "Hello Jasmine"'
                ].join('\n')])
            expect(await failuresOf(() => expect($('#heading')).toHaveText(expect.stringContaining('Mocha'), { wait: 0 })))
                .toEqual([[
                    'Expect $(`#heading`) to have text',
                    '',
                    'Expected: StringContaining "Mocha"',
                    'Received: "Hello Jasmine"'
                ].join('\n')])

            const [jasmineMatcherFailure] = await failuresOf(() => expect($('#heading')).toHaveText(jasmine.stringContaining('Mocha'), { wait: 0 }))
            expect(jasmineMatcherFailure).toContain('Expect $(`#heading`) to have text')
            expect(jasmineMatcherFailure).toContain('jasmine.stringContaining(')
            expect(jasmineMatcherFailure).toContain('Received: "Hello Jasmine"')
        })

        it('reports some() failures', async () => {
            expect(await failuresOf(() => expect(some($$('.item'))).toHaveAttribute('data-state', 'missing', { wait: 0 })))
                .toEqual([[
                    'Expect some of $$(`.item`) to have attribute data-state',
                    '',
                    '- Expected  - 2',
                    '+ Received  + 2',
                    '',
                    '  Array [',
                    '-   "missing",',
                    '-   "missing",',
                    '+   "on",',
                    '+   "off",',
                    '  ]'
                ].join('\n')])
            expect(await failuresOf(() => expect(some($$('#box'))).toHaveSize({ width: 1, height: 40 }, { wait: 0 })))
                .toEqual([[
                    'Expect some of $$(`#box`) to have size',
                    '',
                    '- Expected  - 1',
                    '+ Received  + 1',
                    '',
                    '  Array [',
                    '    Object {',
                    '      "height": 40,',
                    '-     "width": 1,',
                    '+     "width": 120,',
                    '    },',
                    '  ]'
                ].join('\n')])
        })
    })
})
