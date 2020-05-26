describe('webdriver.io page', () => {
    it('should be a pending test')

    it('should have the right title', () => {
        browser.url("https://ozon.ru");
        for (let i = 0; i < 50; i++) {
            let el = $('[data-test-id="header-search-input"]');
            el.click();
            el.setValue('Рыба');
            $('[data-test-id="header-search-go"]').click();
            console.log(`request loop: ${i}`);
            expect(browser.getUrl()).to.contain('https://www.ozon.ru/search/?text=');
        }
    })
})
