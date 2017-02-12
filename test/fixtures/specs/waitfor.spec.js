import conf from '../../conf/index.js'

const PageObject = Object.create({}, {
    enabledSelector: { get: () => '//html/body/section/input[8]' },
    enabled: { get: () => browser.element(PageObject.enabledSelector) },

    existSelector: { get: () => '//div[text()="Sorry, I\'m late!"]' },
    exist: { get: () => browser.element(PageObject.existSelector) },

    selectedSelector: { get: () => '//*[@id="selectbox"]/option[3]' },
    selected: { get: () => browser.element(PageObject.selectedSelector) },

    textSelector: { get: () => '//*[contains(@class, "sometextlater")]' },
    text: { get: () => browser.element(PageObject.textSelector) },

    valueSelector: { get: () => '//*[contains(@class, "waitForValueEnabledReverse")]' },
    value: { get: () => browser.element(PageObject.valueSelector) },

    visibleSelector: { get: () => '//*[contains(@class, "notVisible")]' },
    visible: { get: () => browser.element(PageObject.visibleSelector) }
})

let errorWasThrown = false

describe('waitFor', () => {
    beforeEach(() => {
        browser.url(conf.testPage.start)
        errorWasThrown = false
    })

    it('should have selector in error message executing waitForEnabled', () => {
        try {
            PageObject.enabled.waitForEnabled(1)
        } catch (e) {
            errorWasThrown = true
            expect(e.message).to.contain(PageObject.enabledSelector)
        }

        expect(errorWasThrown).to.be.ok
    })

    it('should have selector in error message executing waitForExist', () => {
        try {
            PageObject.exist.waitForExist(1)
        } catch (e) {
            errorWasThrown = true
            expect(e.message).to.contain(PageObject.existSelector)
        }

        expect(errorWasThrown).to.be.ok
    })

    it('should be able to wait if only a timeout is given', () => {
        try {
            PageObject.exist.waitForExist(5500)
        } catch (e) {
            errorWasThrown = true
            expect(e.message).to.contain(PageObject.existSelector)
        }

        expect(errorWasThrown).to.be.not.ok
    })

    it('should not find elements that are not within child tree', () => {
        const elem = $('=3')
        try {
            elem.waitForExist('.page')
        } catch (e) {
            errorWasThrown = true
        }

        expect(errorWasThrown).to.be.ok
    })

    it('should have selector in error message executing waitForSelected', () => {
        try {
            PageObject.selected.waitForSelected(1)
        } catch (e) {
            errorWasThrown = true
            expect(e.message).to.contain(PageObject.selectedSelector)
        }

        expect(errorWasThrown).to.be.ok
    })

    it('should have selector in error message executing waitForText', () => {
        try {
            PageObject.text.waitForText(1)
        } catch (e) {
            errorWasThrown = true
            expect(e.message).to.contain(PageObject.textSelector)
        }

        expect(errorWasThrown).to.be.ok
    })

    it('should have selector in error message executing waitForValue', () => {
        try {
            PageObject.value.waitForValue(1)
        } catch (e) {
            errorWasThrown = true
            expect(e.message).to.contain(PageObject.valueSelector)
        }

        expect(errorWasThrown).to.be.ok
    })

    it('should have selector in error message executing waitForVisible', () => {
        try {
            PageObject.visible.waitForVisible(1)
        } catch (e) {
            errorWasThrown = true
            expect(e.message).to.contain(PageObject.visibleSelector)
        }

        expect(errorWasThrown).to.be.ok
    })
})
