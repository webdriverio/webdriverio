import Page from './page/index.js'

class DynamicPage extends Page {
    /**
     * define elements
     */
    get btnStart () { return $('button=Start') }
    get loadedPage () { return $('#finish') }

    /**
     * define or overwrite page methods
     */
    open () {
        return super.open('dynamic_loading/2')
    }
}

export default new DynamicPage()
