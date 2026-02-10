import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe('Accessibility Strictness Mode', () => {
    const fixtureUrl = url.pathToFileURL(path.join(__dirname, '__fixtures__', 'a11yStrict.html')).href

    describe('a11yStrict: false (default)', () => {
        it('should return the first matching element when multiple exist', async () => {
            await browser.url(fixtureUrl)
            // 'Submit' matches both <button> and <div role="button">
            const submitBtn = await $('a11y/Submit')
            expect(await submitBtn.getTagName()).toBe('button')
        })

        it('should find a unique element without error', async () => {
            await browser.url(fixtureUrl)
            const cancelBtn = await $('a11y/Cancel')
            expect(await cancelBtn.getTagName()).toBe('button')
            expect(await cancelBtn.getText()).toBe('Cancel')
        })
    })

    // For strict mode, we need to test with a11yStrict: true
    // Since capabilities are set at session init, we'll test the warning behavior
    // OR we accept that the current session has whatever config is set.

    // To properly test strict mode, we would need browser.reloadSession or a separate config.
    // For this test, we verify the feature works by checking if the selector finds elements.
    describe('a11y selector basic functionality', () => {
        it('should find element by accessible name', async () => {
            await browser.url(fixtureUrl)
            // Use role to distinguish between label and input which share the same name
            const usernameInput = await $('a11y/Username[role=textbox]')
            expect(await usernameInput.getTagName()).toBe('input')
        })

        it('should return multiple elements with $$', async () => {
            await browser.url(fixtureUrl)
            // Both 'Submit' buttons (the <button> and the <div role="button">)
            const submitBtns = await $$('a11y/Submit')
            expect(submitBtns.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe('Intensive E2E Scenarios', () => {
        const complexFixtureUrl = url.pathToFileURL(path.join(__dirname, '__fixtures__', 'a11yStrictComplex.html')).href

        beforeEach(async () => {
            await browser.url(complexFixtureUrl)
        })

        it('should support chained selectors (scope limitation)', async () => {
            // Find the Settings section
            const settingsParams = await $('a11y/Settings')
            expect(await settingsParams.getTagName()).toBe('section')

            // Search for "Save" INSIDE Settings
            const saveBtn = await settingsParams.$('a11y/Save')
            expect(await saveBtn.getTagName()).toBe('button')

            // Verify we don't accidentally find "Register" from the other section
            // (Mock test: register is in Registration section)
            const registerInSettings = await settingsParams.$('a11y/Register')
            await expect(registerInSettings).not.toBeExisting()
        })

        it('should allow interaction with a11y-located elements', async () => {
            const username = await $('a11y/Username[role=textbox]')
            await username.setValue('testuser')
            expect(await username.getValue()).toBe('testuser')
        })

        it('should handle dynamic waiting (waitForExist)', async () => {
            const trigger = await $('a11y/Show Message')
            await trigger.click()

            // Button appears after 500ms
            const delayedBtn = await $('a11y/Delayed Button')

            // Should not exist yet (immediately) - race condition strictness?
            // strict mode might be slow, but let's assume it's fast enough or check later

            // Wait for it
            await delayedBtn.waitForExist()
            expect(await delayedBtn.isDisplayed()).toBe(true)
        })

        it('should ignore hidden elements by default', async () => {
            const hiddenBtn = await $('a11y/Hidden Action')
            await expect(hiddenBtn).not.toBeExisting()
        })
    })

    describe('Active Strict Mode', () => {
        before(async () => {
            // dynamically enable strict mode for this suite
            // @ts-ignore
            browser.options.a11yStrict = true
        })

        after(async () => {
            // revert to default
            // @ts-ignore
            browser.options.a11yStrict = false
        })

        it('should throw error when multiple elements match', async () => {
            const fixtureUrl = url.pathToFileURL(path.join(__dirname, '__fixtures__', 'a11yStrict.html')).href
            await browser.url(fixtureUrl)

            // "Submit" matches 2 elements
            await expect(async () => {
                await $('a11y/Submit')
            }).rejects.toThrow(/Strict mode violation/)
        })

        it('should still find unique elements', async () => {
            const fixtureUrl = url.pathToFileURL(path.join(__dirname, '__fixtures__', 'a11yStrict.html')).href
            await browser.url(fixtureUrl)

            const cancelBtn = await $('a11y/Cancel')
            expect(await cancelBtn.getTagName()).toBe('button')
        })
    })
})
