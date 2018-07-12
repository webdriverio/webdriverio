import Page from './page'

class CheckboxPage extends Page {
    /**
     * define elements
     */
    get lastCheckbox () { return $('#checkboxes input:last-Child') }
    get firstCheckbox () { return $('#checkboxes input:first-Child') }

    /**
     * define or overwrite page methods
     */
    open () {
        super.open('checkboxes')
    }
}

export default new CheckboxPage()
