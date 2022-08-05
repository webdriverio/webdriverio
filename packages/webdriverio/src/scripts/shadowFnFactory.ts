// generate a function that can be used to query shadowRoots
export const shadowFnFactory = function(elementSelector: string, qsAll = false) {
    const strFn = /*js*/`
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
