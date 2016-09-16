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

describe('waitUntil', () => {
    beforeEach(() => {
        browser.url(conf.testPage.start)
    })

    it('should have selector in error message executing waitForEnabled', () => {
        try {
            PageObject.enabled.waitForEnabled(1)
        } catch (e) {
            expect(e.message).to.contain(PageObject.enabledSelector)
        }
    })

    it('should have selector in error message executing waitForExist', () => {
        try {
            PageObject.exist.waitForExist(1)
        } catch (e) {
            expect(e.message).to.contain(PageObject.existSelector)
        }
    })

    it('should have selector in error message executing waitForSelected', () => {
        try {
            PageObject.selected.waitForSelected(1)
        } catch (e) {
            expect(e.message).to.contain(PageObject.selectedSelector)
        }
    })

    it('should have selector in error message executing waitForText', () => {
        try {
            PageObject.text.waitForText(1)
        } catch (e) {
            expect(e.message).to.contain(PageObject.textSelector)
        }
    })

    it('should have selector in error message executing waitForValue', () => {
        try {
            PageObject.value.waitForValue(1)
        } catch (e) {
            expect(e.message).to.contain(PageObject.valueSelector)
        }
    })

    it('should have selector in error message executing waitForVisible', () => {
        try {
            PageObject.visible.waitForVisible(1)
        } catch (e) {
            expect(e.message).to.contain(PageObject.visibleSelector)
        }
    })
})
