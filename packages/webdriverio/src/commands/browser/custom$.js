import { runFnInFiberContext } from '@wdio/utils/build/shim'
import { getElement } from '../../utils/getElementObject'

async function custom$ (strategyName, ...args) {
    const strategy = this.strategies.get(strategyName)

    if (!strategy) {
        throw Error('No strategy found for ' + strategyName)
    }
    const res = await this.execute(strategy, args)

    return await getElement.call(this, strategy, res)
}

export default runFnInFiberContext(custom$)