import { Actions } from '../../scripts/actions'

export default function actions(this: WebdriverIO.Browser) {
    return new Actions(this)
}
