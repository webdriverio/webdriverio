
// generate a function (string) that queries for the desired selector
const fnFactory = function(elementSelector, qsAll) {
    const strFn = `(function() {
      // element has a shadowRoot property
      if (this.shadowRoot) {
        return this.shadowRoot.querySelector${qsAll ? 'All' : ''}('${elementSelector}')
      }
      // fall back to querying the element directly if not
      return this.querySelector${qsAll ? 'All' : ''}('${elementSelector}')
    })`
    return eval(strFn)
}

export default class ShadowDomService {

    before() {
        // create element commands
        global.browser.addCommand('shadow$', async function shadow$ (selector) {
            return await this.$(fnFactory(selector))
        }, true)
        global.browser.addCommand('shadow$$', async function shadow$ (selector) {
            return await this.$$(fnFactory(selector, true))
        }, true)
    }
}
