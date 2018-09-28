import findStrategy from '../../../lib/helpers/findElementStrategy'

describe('selector strategies helper', () => {
    it('should find an element using "css selector" method', () => {
        const element = findStrategy('.red')
        element.using.should.be.equal('css selector')
        element.value.should.be.equal('.red')
    })

    it('should find an element using "id" method', () => {
        const element = findStrategy('#purplebox')
        element.using.should.be.equal('id')
        element.value.should.be.equal('purplebox')
    })

    it('should find an element using "name" method', () => {
        const element = findStrategy('[name="searchinput"]')
        element.using.should.be.equal('name')
        element.value.should.be.equal('searchinput')
    })

    it('should find an element using "name" method with a . in the name', () => {
        const element = findStrategy('[name="search.input"]')
        element.using.should.be.equal('name')
        element.value.should.be.equal('search.input')
    })

    it('should find an element using "link text" method', () => {
        const element = findStrategy('=GitHub Repo')
        element.using.should.be.equal('link text')
        element.value.should.be.equal('GitHub Repo')
    })

    it('should find an element using "partial link text" method', () => {
        const element = findStrategy('*=new')
        element.using.should.be.equal('partial link text')
        element.value.should.be.equal('new')
    })

    it('should find an element using "tag name" method and tag format <XXX />', () => {
        const element = findStrategy('<textarea />')
        element.using.should.be.equal('tag name')
        element.value.should.be.equal('textarea')
    })

    it('should find an element using "tag name" method and tag format <XXX>', () => {
        const element = findStrategy('<textarea>')
        element.using.should.be.equal('tag name')
        element.value.should.be.equal('textarea')
    })

    it('should find an element using "xpath" method', () => {
        const element = findStrategy('//html/body/section/div[6]/div/span')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//html/body/section/div[6]/div/span')
    })

    it('should find an element using "xpath" method for ParenthesizedExpressions', () => {
        const element = findStrategy('(//div)[7]/span')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('(//div)[7]/span')
    })

    // check if it is still backwards compatible for obsolete command
    it('should find an element by defining custom strategy', () => {
        const element = findStrategy('my special strategy', '#.some [weird] selector', () => {})
        element.using.should.be.equal('my special strategy')
        element.value.should.be.equal('#.some [weird] selector')
    })

    it('should find an element by tag name + content', () => {
        const element = findStrategy('div=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + id + similar content', () => {
        const element = findStrategy('h1=Christian')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//h1[normalize-space() = "Christian"]')
    })

    it('should find an element by tag name + similar content', () => {
        const element = findStrategy('div*=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by tag name + class + content', () => {
        const element = findStrategy('div.some-class=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[contains(@class, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element class + content', () => {
        const element = findStrategy('.some-class=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[contains(@class, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + class + similar content', () => {
        const element = findStrategy('div.some-class*=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[contains(@class, "some-class") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by class + similar content', () => {
        const element = findStrategy('.some-class*=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[contains(@class, "some-class") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by tag name + id + content', () => {
        const element = findStrategy('div#some-class=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[contains(@id, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by id + content', () => {
        const element = findStrategy('#some-class=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[contains(@id, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + id + similar content', () => {
        const element = findStrategy('div#some-id*=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[contains(@id, "some-id") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by id + similar content', () => {
        const element = findStrategy('#some-id*=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[contains(@id, "some-id") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by id + similar content see #1494', () => {
        const element = findStrategy('#What-is-WebdriverIO*=What')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[contains(@id, "What-is-WebdriverIO") and contains(., "What")]')
    })

    it('should find an element by tag name + attribute + content', () => {
        const element = findStrategy('div[some-attribute="some-value"]=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[contains(@some-attribute, "some-value") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by attribute + content', () => {
        const element = findStrategy('[some-attribute="some-value"]=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[contains(@some-attribute, "some-value") and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by attribute existence + content', () => {
        const element = findStrategy('[some-attribute]=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[@some-attribute and normalize-space() = "some random text with "§$%&/()div=or others"]')
    })

    it('should find an element by tag name + attribute + similar content', () => {
        const element = findStrategy('div[some-attribute="some-value"]*=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//div[contains(@some-attribute, "some-value") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by attribute + similar content', () => {
        const element = findStrategy('[some-attribute="some-value"]*=some random text with "§$%&/()div=or others')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('//*[contains(@some-attribute, "some-value") and contains(., "some random text with "§$%&/()div=or others")]')
    })

    it('should find an element by ui automator strategy (android only)', () => {
        const element = findStrategy('android=foo')
        element.using.should.be.equal('-android uiautomator')
        element.value.should.be.equal('foo')
    })

    it('should find an element by ui automation strategy (ios only)', () => {
        const element = findStrategy('ios=foo')
        element.using.should.be.equal('-ios uiautomation')
        element.value.should.be.equal('foo')
    })

    it('should find an element by predicate string strategy (ios >= 10 only)', () => {
        const element = findStrategy('ios=predicate=foo')
        element.using.should.be.equal('-ios predicate string')
        element.value.should.be.equal('foo')
    })

    it('should find an element by class chain strategy (ios >= 10 only)', () => {
        const element = findStrategy('ios=chain=foo')
        element.using.should.be.equal('-ios class chain')
        element.value.should.be.equal('foo')
    })

    it('should find an element by accessibility id', () => {
        const element = findStrategy('~foo')
        element.using.should.be.equal('accessibility id')
        element.value.should.be.equal('foo')
    })

    it('should find an element by css selector with id and attribute', () => {
        const element = findStrategy('#purplebox[data-foundBy]')
        element.using.should.be.equal('css selector')
    })

    it('should find an element by css selector with id and immediately preceded operator', () => {
        const element = findStrategy('#purplebox+div')
        element.using.should.be.equal('css selector')
    })

    it('should find an element by css selector with id and preceded operator', () => {
        const element = findStrategy('#purplebox~div')
        element.using.should.be.equal('css selector')
    })

    it('should find an element by css selector with id and pseudo class', () => {
        const element = findStrategy('#purplebox:before')
        element.using.should.be.equal('css selector')
    })

    it('should find an element by android accessibility id', () => {
        const selector = 'new UiSelector().text("Cancel")).className("android.widget.Button")'
        const element = findStrategy('android=' + selector)
        element.using.should.be.equal('-android uiautomator')
        element.value.should.be.equal(selector)
    })

    it('should find an element by ios UiAutomation', () => {
        const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
        const element = findStrategy('ios=' + selector)
        element.using.should.be.equal('-ios uiautomation')
        element.value.should.be.equal(selector)
    })

    it('should find an element by ios XCUITest Predicate String', () => {
        const selector = 'type === \'XCUITestTypeButton\' && name CONTAINS \'Enable\''
        const element = findStrategy('ios=predicate=' + selector)
        element.using.should.be.equal('-ios predicate string')
        element.value.should.be.equal(selector)
    })

    it('should find an element by ios XCUITest Class Chain', () => {
        const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "B"`]'
        const element = findStrategy('ios=chain=' + selector)
        element.using.should.be.equal('-ios class chain')
        element.value.should.be.equal(selector)
    })

    it('should find an mobile ios element class name', () => {
        const element = findStrategy('UIATextField')
        element.using.should.be.equal('class name')
    })

    it('should find an mobile android element class name', () => {
        const element = findStrategy('android.widget.EditText')
        element.using.should.be.equal('class name')
    })

    it('allows to specify selector strategy directly', () => {
        let element = findStrategy('id:foobar id')
        element.using.should.be.equal('id')
        element.value.should.be.equal('foobar id')
        element = findStrategy('css selector:foobar css selector')
        element.using.should.be.equal('css selector')
        element.value.should.be.equal('foobar css selector')
        element = findStrategy('xpath:foobar xpath')
        element.using.should.be.equal('xpath')
        element.value.should.be.equal('foobar xpath')
        element = findStrategy('link text:foobar link text')
        element.using.should.be.equal('link text')
        element.value.should.be.equal('foobar link text')
        element = findStrategy('partial link text:foobar partial link text')
        element.using.should.be.equal('partial link text')
        element.value.should.be.equal('foobar partial link text')
        element = findStrategy('name:foobar name')
        element.using.should.be.equal('name')
        element.value.should.be.equal('foobar name')
        element = findStrategy('tag name:foobar tag name')
        element.using.should.be.equal('tag name')
        element.value.should.be.equal('foobar tag name')
        element = findStrategy('class name:foobar class name')
        element.using.should.be.equal('class name')
        element.value.should.be.equal('foobar class name')
        element = findStrategy('-android uiautomator:foobar -android uiautomator')
        element.using.should.be.equal('-android uiautomator')
        element.value.should.be.equal('foobar -android uiautomator')
        element = findStrategy('-ios uiautomation:foobar -ios uiautomation')
        element.using.should.be.equal('-ios uiautomation')
        element.value.should.be.equal('foobar -ios uiautomation')
        element = findStrategy('-ios predicate string:foobar -ios predicate string')
        element.using.should.be.equal('-ios predicate string')
        element.value.should.be.equal('foobar -ios predicate string')
        element = findStrategy('-ios class chain:foobar -ios class chain')
        element.using.should.be.equal('-ios class chain')
        element.value.should.be.equal('foobar -ios class chain')
        element = findStrategy('accessibility id:foobar accessibility id')
        element.using.should.be.equal('accessibility id')
        element.value.should.be.equal('foobar accessibility id')

        element = findStrategy('.ui-cloud__sec__develop-content__app-grid:nth-child(1)')
        element.using.should.be.equal('css selector')
        element.value.should.be.equal('.ui-cloud__sec__develop-content__app-grid:nth-child(1)')
    })
})
