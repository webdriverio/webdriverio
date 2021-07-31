import { Actions } from 'src/classes/actions'

export default function actions (this: WebdriverIO.Browser) {
    return new Actions(this)
}
