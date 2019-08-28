describe('PT demo', () => {
  before(() => {
    browser.enablePerformanceAudits()
  })

  it('page a', () => {
    browser.url('https://www.youtube.com')
    console.log(browser.getMetrics())
  })

  it('page b', () => {
    browser.url('https://www.facebook.com/')
    console.log(browser.getMetrics())
  })

  it('page c', () => {
    browser.url('https://twitter.com')
    console.log(browser.getMetrics())
  })

  after(() => {
    browser.disablePerformanceAudits()
  })
})
