import { getBrowserObject } from '../../utils/index.js'

/**
 *
 * Will return true when stable (in animation) or when unstable (not in animation)
 *
 * <example>
    :index.html
    <head>
    <style>
        div {
        width: 200px;
        height: 200px;
        background-color: red;
        animation: 3s 0s alternate slidein;
        }
        @keyframes slidein {
        from {
            margin-left: 100%;
            width: 300%;
        }

        to {
            margin-left: 0%;
            width: 100%;
        }
        }
    </style>
    </head>
    <body>
    <div></div>
    </body>

    :isStable.js
    it('should detect if an element is stable', async () => {
        let element = await $('#has-animation');
        console.log(await element.isStable()); // outputs: true

        element = await $('#has-no-animation')
        console.log(await element.isStable()); // outputs: false
    });
 * </example>
 *
 * @alias element.isStable
 * @return {Boolean} true if element is stable, false if unstable
 * @type state
 *
 */
export async function isStable (this: WebdriverIO.Element) {
    const browser = getBrowserObject(this)
    return await browser.executeAsync((elem, done) => {
        if (document.visibilityState === 'hidden') {
            throw Error('You are using isStable for an inactive tab, animations do not run for inactive tabs')
        }
        try {
            const previousPosition = elem.getBoundingClientRect()
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const currentPosition = elem.getBoundingClientRect()
                    for (const prop in previousPosition) {
                        if (previousPosition[(prop as keyof DOMRect)] !== currentPosition[(prop as keyof DOMRect)]) {
                            done(false)
                        }
                    }
                    done(true)
                })
            })
        } catch (error) {
            done(false)
        }
    }, await this as unknown as HTMLElement)
}
