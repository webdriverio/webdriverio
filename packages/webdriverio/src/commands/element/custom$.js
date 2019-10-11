import { runFnInFiberContext } from '@wdio/utils/build/shim'
import { getElement } from '../../utils/getElementObject'
import { getBrowserObject } from '../../utils'

async function custom$ (strategyName, strategyArgument) {
    const browserObject = getBrowserObject(this)
    const strategy = browserObject.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }

    let parent

    if (this.elementId) {
        switch(this.parent.constructor.name) {
        case 'Element':
            parent = this.parent
            break
        case 'Browser':
        default:
            parent = browserObject.$('html')
            break
        }
    }

    const res = await this.execute(strategy, strategyArgument, parent)

    return await getElement.call(this, strategy, res)
}

export default runFnInFiberContext(custom$)
