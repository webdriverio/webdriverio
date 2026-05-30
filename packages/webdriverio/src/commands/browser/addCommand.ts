/**
 * The browser method  `addCommand` helps you to write your own set of commands.
 *
 * :::info
 *
 * You can find more information on adding custom commands in the [custom command](/docs/customcommands#adding-custom-commands) guide.
 *
 * :::
 *
 * <example>
    :execute.js
    // Basic usage with browser scope
    await browser.addCommand('getUrlAndTitle', async function (customParam) {
        // `this` refers to the `browser` scope
        return {
            url: await this.getUrl(),
            title: await this.getTitle(),
            customParam: customParam
        }
    })

    // Element scope using options object (RECOMMENDED)
    await browser.addCommand('waitAndClick', async function () {
        // `this` refers to the `element` scope
        await this.waitForClickable()
        await this.click()
    }, { attachToElement: true })

    // Advanced usage with options
    await browser.addCommand('fastClick', async function () {
        // `this` refers to the `element` scope
        await this.click()
    }, {
        attachToElement: true,
        disableElementImplicitWait: true // Skip implicit wait for faster execution
    })

    //usage
    it('should use my add command', async () => {
        await browser.url('https://webdriver.io')
        const result = await browser.getUrlAndTitle('foobar')

        assert.strictEqual(result.url, 'https://webdriver.io')
        assert.strictEqual(result.title, 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
        assert.strictEqual(result.customParam, 'foobar')

        // Using element commands
        const element = await $('button')
        await element.waitAndClick()
        await element.fastClick()
    })
 * </example>
 * @alias browser.addCommand
 * @param {string} name name of the custom command
 * @param {Function} callback  function to be called
 * @param {Boolean|Object=} options **DEPRECATED when Boolean (elementScope)**. Options object with the following properties:
 * @param {Boolean=} options.attachToElement extend the Element object instead of the Browser object
 * @param {Boolean=} options.disableElementImplicitWait disable implicit wait for element commands
 * @type utility
 *
 */
