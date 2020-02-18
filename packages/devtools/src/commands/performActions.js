const sleep = (time = 0) => new Promise(
    (resolve) => setTimeout(resolve, time))

export default async function performActions ({ actions }) {
    const page = this.getPageHandle()
    const lastPointer = {}

    /**
     * see https://github.com/jlipps/simple-wd-spec#input-sources-and-corresponding-actions
     * for details on the `actions` format
     */
    for (const action of actions) {
        if (action.type === null || action.type === 'null') {
            for (const singleAction of action.actions) {
                await sleep(singleAction.duration)
            }
            continue
        }

        if (action.type === 'key') {
            for (const singleAction of action.actions) {
                if (singleAction.type === 'pause') {
                    await sleep(singleAction.duration)
                    continue
                }

                const cmd = singleAction.type.slice(3).toLowerCase()
                const keyboardFn = ::page.keyboard[cmd]
                await keyboardFn(singleAction.value, { text: singleAction.value })
                continue
            }
            continue
        }

        if (action.type === 'pointer') {
            if (action.parameters && action.parameters.pointerType && action.parameters.pointerType !== 'mouse') {
                throw new Error('Currently only "mouse" is supported as pointer type')
            }

            for (const singleAction of action.actions) {
                if (singleAction.type === 'pause') {
                    await sleep(singleAction.duration)
                    continue
                }

                const cmd = singleAction.type.slice(7).toLowerCase()
                const keyboardFn = ::page.mouse[cmd]
                let { x, y, duration, button, origin } = singleAction

                if (cmd === 'move') {
                    /**
                     * set location relative from last position if origin is set to pointer
                     */
                    if (origin === 'pointer' && lastPointer.x && lastPointer.y) {
                        x += lastPointer.x
                        y += lastPointer.y
                    }

                    lastPointer.x = x
                    lastPointer.y = y
                    await keyboardFn(x, y, { steps: 10 })
                    continue
                } else {
                    const pptrButton = (
                        button === 0 ? 'left' : (
                            button === 1 ? 'middle' : 'right'
                        )
                    )
                    await keyboardFn({ button: pptrButton })
                }

                if (duration) {
                    await sleep(duration)
                }
                continue
            }
            continue
        }

        throw new Error(`Unknown action type ("${action.type}"), allowed are only: null, key and pointer`)
    }
}
