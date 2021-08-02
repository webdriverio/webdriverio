enum ActionButton {
    'left',
    'middle',
    'right',
}

enum CompositionActionType {
    key = 'key',
    pointer = 'pointer',
    none = 'none',
}

enum PointerType {
    mouse = 'mouse',
    touch = 'touch',
    pen = 'pen',
}

interface KeyboardCompositionAction {
    type: CompositionActionType.key
    id: string
    actions: (PauseAction | KeyDownAction | KeyUpAction)[]
}

interface MouseCompositionAction {
    type: CompositionActionType.pointer
    id: string
    parameters?: { pointerType: PointerType }
    actions: (
        | PauseAction
        | PointerDownAction
        | PointerUpAction
        | PointerMoveAction
    )[]
}

interface PauseCompositionAction {
    type: CompositionActionType
    id: string
    actions: PauseAction[]
}

interface PauseAction {
    type: 'pause'
    duration: number
}

interface PointerDownAction {
    type: 'pointerDown'
    button: ActionButton // left, middle, right
}

interface PointerUpAction {
    type: 'pointerUp'
    button: ActionButton // left, middle, right
}

interface PointerMoveAction {
    type: 'pointerMove'
    /**
     * integer in ms
     */
    duration?: number
    /**
     * either (a) string, one of 'viewport' or 'pointer', or (b) an object representing a web element. Defaults to viewport if origin is omitted.
     */
    origin?: 'viewport' | 'pointer' | WebdriverIO.Element
    /**
     * x-value to move to, relative to either viewport, pointer, or element based on origin
     */
    x: number
    /**
     * y-value to move to, relative to either viewport, pointer, or element based on origin
     */
    y: number
}

interface KeyDownAction {
    type: 'keyDown'
    /**
     * integer in ms
     */
    duration?: number
    /**
     * a string containing a single Unicode code point (any value in the Unicode code space).
     * Basically, this is either a 'normal' character like 'A',
     * or a Unicode code point like '\uE007' (Enter),
     * which can include control characters.
     */
    value: string
    origin?: 'viewport' | 'pointer' | WebdriverIO.Element
}

interface KeyUpAction {
    type: 'keyUp'
    /**
     * integer in ms
     */
    duration?: number
    /**
     * a string containing a single Unicode code point (any value in the Unicode code space).
     * Basically, this is either a 'normal' character like 'A',
     * or a Unicode code point like '\uE007' (Enter),
     * which can include control characters.
     */
    value: string
    origin?: 'viewport' | 'pointer' | WebdriverIO.Element
}

class ActionsBuilder {
    constructor(private browser: WebdriverIO.Browser) {}

    private asInteraction(
        action:
            | KeyboardCompositionAction
            | MouseCompositionAction
            | PauseCompositionAction
    ) {
        if (action.type === 'none') return action as PauseCompositionAction
        if (action.type === 'key') return action as KeyboardCompositionAction
        if (action.type === 'pointer') return action as MouseCompositionAction
        throw Error('Type not supported.')
    }

    public pointerType: PointerType = this.browser.isMobile
        ? PointerType.touch
        : PointerType.mouse

    public actions: (
        | KeyboardCompositionAction
        | MouseCompositionAction
        | PauseCompositionAction
    )[] = []

    public addAction(
        action:
            | KeyboardCompositionAction
            | MouseCompositionAction
            | PauseCompositionAction
    ) {
        if (this.actions.length > 0) {
            const lastAction = this.actions[this.actions.length - 1]
            //   const lastOrigin = (
            //     lastAction.actions[lastAction.actions.length - 1] as
            //       | KeyDownAction
            //       | KeyUpAction
            //   ).origin
            //   const origin = (
            //     action.actions[action.actions.length - 1] as KeyDownAction | KeyUpAction
            //   ).origin

            if (lastAction.type === 'key' && action.type === 'key') {
                const actions = lastAction.actions.concat(
                    action.actions as any
                )
                lastAction.actions = actions
                return
            }
            if (lastAction.type === 'pointer' && action.type === 'pointer') {
                const actions = lastAction.actions.concat(
                    action.actions as any
                )
                lastAction.actions = actions
                return
            }

            if (lastAction.type === 'key' && action.type === 'none') {
                action.type = lastAction.type
                const actions = lastAction.actions.concat(action.actions)
                lastAction.actions = actions
                return
            }
            if (lastAction.type === 'pointer' && action.type === 'none') {
                action.type = lastAction.type
                const actions = lastAction.actions.concat(action.actions)
                lastAction.actions = actions
                return
            }
        }

        const index = this.actions.length - 1
        action.id += index
        this.actions.push(this.asInteraction(action))
    }

    public async perform(
        compositeActions?: (
            | KeyboardCompositionAction
            | MouseCompositionAction
            | PauseCompositionAction
        )[]
    ) {
        const actions = compositeActions || this.actions
        console.log('actions: ', JSON.stringify(actions, null, 2))

        for (const actionSet of actions) {
            await this.browser.performActions([actionSet])
        }

        await this.browser.releaseActions()

        this.actions = []
    }

    public click(button: ActionButton = 0): MouseCompositionAction {
        return {
            type: CompositionActionType.pointer,
            id: 'click',
            parameters: { pointerType: this.pointerType },
            actions: [
                { type: 'pointerDown', button },
                { type: 'pointerUp', button },
            ],
        }
    }

    public clickAndHold(): MouseCompositionAction {
        return {
            type: CompositionActionType.pointer,
            id: 'clickAndHold',
            parameters: { pointerType: this.pointerType },
            actions: [{ type: 'pointerDown', button: 0 }],
        }
    }

    public keyAction({
        origin,
        type,
        value,
    }: {
        origin?: WebdriverIO.Element
        type: 'keyDown' | 'keyUp'
        value: string
    }): KeyboardCompositionAction {
        return {
            type: CompositionActionType.key,
            id: 'keyAction',
            actions: [{ origin, type, value }],
        }
    }

    public moveTo({
        origin,
        x,
        y,
    }: {
        origin?: WebdriverIO.Element
        x: number
        y: number
    }): MouseCompositionAction {
        return {
            type: CompositionActionType.pointer,
            id: 'moveTo',
            parameters: { pointerType: this.pointerType },
            actions: [{ type: 'pointerMove', origin, x, y }],
        }
    }

    public pause(duration: number = 0): PauseCompositionAction {
        return {
            type: CompositionActionType.none,
            id: 'pause',
            actions: [{ type: 'pause', duration }],
        }
    }

    public release(button: ActionButton = 0): MouseCompositionAction {
        return {
            type: CompositionActionType.pointer,
            id: 'release',
            parameters: { pointerType: this.pointerType },
            actions: [{ type: 'pointerUp', button }],
        }
    }
}

/* eslint-disable no-dupe-class-members */

/**
 * NOTE: only works for W3C compatible browsers
 * The user-facing API for emulating complex user gestures.
 * Use this class rather than using the Keyboard or Mouse directly.
 * Implements the builder pattern: Builds a CompositeAction containing all actions specified by the method calls.
 * Call perform() at the end of the method chain to actually perform the actions.
 */
export class Actions {
    constructor(private browser: WebdriverIO.Browser) {}

    private compositeActions = new ActionsBuilder(this.browser)
    private actions: (
        | KeyboardCompositionAction
        | MouseCompositionAction
        | PauseCompositionAction
    )[] = []

    /**
     * Generates a composite action containing all actions so far, ready to be performed (and resets the internal builder state, so subsequent calls to this method will contain fresh sequences).
     */
    public build() {
        this.actions = this.compositeActions.actions
        this.compositeActions = new ActionsBuilder(this.browser)
        return this.actions
    }

    /**
     * Clicks at the current mouse location.
     */
    public click(): Actions
    /**
     * Clicks in the middle of the given element.
     */
    public click(target: WebdriverIO.Element): Actions
    public click(target?: WebdriverIO.Element): Actions {
        if (typeof target !== 'undefined') {
            this.moveToElement(target)
        }

        this.compositeActions.addAction(this.compositeActions.click())

        return this
    }

    /**
     * Clicks (without releasing) at the current mouse location.
     */
    public clickAndHold(): Actions
    /**
     * Clicks (without releasing) in the middle of the given element.
     */
    public clickAndHold(target: WebdriverIO.Element): Actions
    public clickAndHold(target?: WebdriverIO.Element): Actions {
        if (typeof target !== 'undefined') {
            this.moveToElement(target)
        }

        this.compositeActions.addAction(this.compositeActions.clickAndHold())

        return this
    }

    /**
     * Performs a context-click at the current mouse location.
     */
    public contentClick(): Actions
    /**
     * Performs a context-click at middle of the given element.
     */
    public contentClick(target: WebdriverIO.Element): Actions
    public contentClick(target?: WebdriverIO.Element) {
        if (typeof target !== 'undefined') {
            this.moveToElement(target)
        }

        this.compositeActions.addAction(this.compositeActions.click(2))

        return this
    }

    /**
     * Performs a double-click at the current mouse location.
     */
    public doubleClick(): Actions
    /**
     * Performs a double-click at middle of the given element.
     */
    public doubleClick(target: WebdriverIO.Element): Actions
    public doubleClick(target?: WebdriverIO.Element) {
        if (typeof target !== 'undefined') {
            this.moveToElement(target)
        }

        this.click().pause(10).click()

        return this
    }

    /**
     * A convenience method that performs click-and-hold at the location of the source element, moves to the location of the target element, then releases the mouse.
     */
    public dragAndDrop(
        source: WebdriverIO.Element,
        target: WebdriverIO.Element
    ): Actions {
        this.clickAndHold(source)
            .pause(10)
            .moveToElement(target)
            .release(target)

        return this
    }

    /**
     * A convenience method that performs click-and-hold at the location of the source element, moves by a given offset, then releases the mouse.
     */
    public dragAndDropBy(
        source: WebdriverIO.Element,
        x: number,
        y: number
    ): Actions {
        this.clickAndHold(source).pause(10).moveByOffset(x, y).release()

        return this
    }

    /**
     * Performs a modifier key press.
     */
    public keyDown(keys: string): Actions
    /**
     * Performs a modifier key press after focusing on an element.
     */
    public keyDown(target: WebdriverIO.Element, keys: string): Actions
    public keyDown(target: unknown, key?: string): Actions {
        if (typeof key === 'undefined') {
            [key, target] = [target as string, key]
        }

        if (typeof target !== 'undefined') {
            this.moveToElement(target as WebdriverIO.Element)
        }

        this.compositeActions.addAction(
            this.compositeActions.keyAction({ type: 'keyDown', value: key })
        )

        return this
    }

    /**
     * Performs a modifier key press.
     */
    public keyUp(keys: string): Actions
    /**
     * Performs a modifier key press after focusing on an element.
     */
    public keyUp(target: WebdriverIO.Element, keys: string): Actions
    public keyUp(target: unknown, key?: string): Actions {
        if (typeof key === 'undefined') {
            [key, target] = [target as string, key]
        }

        if (typeof target !== 'undefined') {
            this.moveToElement(target as WebdriverIO.Element)
        }

        this.compositeActions.addAction(
            this.compositeActions.keyAction({ type: 'keyUp', value: key })
        )

        return this
    }

    /**
     * Moves the mouse from its current position (or 0,0) by the given offset.
     */
    public moveByOffset(x: number = 0, y: number = 0): Actions {
        this.compositeActions.addAction(this.compositeActions.moveTo({ x, y }))
        return this
    }

    /**
     * Moves the mouse to the middle of the element.
     */
    public moveToElement(target: WebdriverIO.Element): Actions
    /**
     * Moves the mouse to an offset from the element's in-view center point.
     */
    public moveToElement(
        target: WebdriverIO.Element,
        x: number,
        y: number
    ): Actions
    public moveToElement(
        target: WebdriverIO.Element,
        x: number = 0,
        y: number = 0
    ): Actions {
        this.compositeActions.addAction(
            this.compositeActions.moveTo({ origin: target, x, y })
        )
        return this
    }

    /**
     * Performs a pause.
     */
    public pause(duration: number): Actions {
        this.compositeActions.addAction(this.compositeActions.pause(duration))
        return this
    }

    /**
     * A convenience method for performing the actions without calling build() first.
     */
    public async perform() {
        if (this.actions.length > 0) {
            await this.compositeActions.perform(this.build())
            this.actions = []
            return
        }
        await this.compositeActions.perform()
    }

    /**
     * Releases the depressed left mouse button at the current mouse location.
     */
    public release(): Actions
    /**
     * Releases the depressed left mouse button, in the middle of the given element.
     */
    public release(target: WebdriverIO.Element): Actions
    public release(target?: WebdriverIO.Element): Actions {
        if (typeof target !== 'undefined') {
            this.moveToElement(target)
        }

        this.compositeActions.addAction(this.compositeActions.release())
        return this
    }

    /**
     * Sends keys to the active element.
     */
    public sendKeys(keys: string): Actions
    /**
     * Equivalent to calling: this.click(element).sendKeys(keysToSend).
     */
    public sendKeys(target: WebdriverIO.Element, keys: string): Actions
    public sendKeys(target: unknown, keys?: string): Actions {
        if (typeof keys === 'undefined') {
            [keys, target] = [target as string, keys]
        }

        if (typeof target !== 'undefined') {
            this.click(target as WebdriverIO.Element)
        }

        for (const key of keys) {
            const keyDownAction = this.compositeActions.keyAction({
                origin: target as WebdriverIO.Element,
                type: 'keyDown',
                value: key,
            })

            const keyUpAction = this.compositeActions.keyAction({
                origin: target as WebdriverIO.Element,
                type: 'keyUp',
                value: key,
            })

            this.compositeActions.addAction(keyDownAction)
            this.compositeActions.addAction(keyUpAction)
        }

        return this
    }
}

/* eslint-enable no-dupe-class-members */
