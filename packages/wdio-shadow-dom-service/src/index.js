export default class ShadowDomService {

    static fnFactory(elementSelector, qsAll) {
        const strFn = `
        (function() {
          // element has a shadowRoot property
          if (this.shadowRoot) {
            return this.shadowRoot.querySelector${qsAll ? 'All' : ''}('${elementSelector}')
          }
          // fall back to querying the element directly if not
          return this.querySelector${qsAll ? 'All' : ''}('${elementSelector}')
        })`
        return eval(strFn)
    }

    static async shadow$ (selector) {
        return await this.$(ShadowDomService.fnFactory(selector))
    }

    static async shadow$$ (selector) {
        return await this.$$(ShadowDomService.fnFactory(selector, true))
    }

    before() {
        // add element commands
        global.browser.addCommand('shadow$', ShadowDomService.shadow$, true)
        global.browser.addCommand('shadow$$', ShadowDomService.shadow$$, true)
    }
}
