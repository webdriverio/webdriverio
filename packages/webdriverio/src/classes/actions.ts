interface KeyboardCompositionAction {
    type: "key"
    id: string
    actions: (KeyDownAction | KeyUpAction)[]
}

interface MouseCompositionAction {
    type: "pointer"
    id: string
    parameters?: { pointerType: "mouse" | "pen" | "touch" }
    actions: (
        | PauseAction
        | PointerDownAction
        | PointerUpAction
        | PointerMoveAction
    )[]
}

interface PauseCompositionAction {
    type: null
    id: string
    actions: PauseAction[]
}

interface PauseAction {
    type: "pause"
    duration: number
}

interface PointerDownAction {
    type: "pointerDown"
    button: 0 | 1 | 2 // left, middle, right
}

interface PointerUpAction {
    type: "pointerUp"
    button: 0 | 1 | 2 // left, middle, right
}

interface PointerMoveAction {
    type: "pointerMove"
    /**
     * integer in ms
     */
    duration?: number
    /**
     * either (a) string, one of 'viewport' or 'pointer', or (b) an object representing a web element. Defaults to viewport if origin is omitted.
     */
    origin?: "viewport" | "pointer" | WebdriverIO.Element
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
    type: "keyDown"
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
    origin?: "viewport" | "pointer" | WebdriverIO.Element
}

interface KeyUpAction {
    type: "keyUp"
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
    origin?: "viewport" | "pointer" | WebdriverIO.Element
}

class CompositeAction {
    public actions: (
        | KeyboardCompositionAction
        | MouseCompositionAction
        | PauseCompositionAction
    )[] = []

    private asInteraction(
        action:
            | KeyboardCompositionAction
            | MouseCompositionAction
            | PauseCompositionAction
    ) {
        if (action.type === null) return action as PauseCompositionAction
        if (action.type === "key") return action as KeyboardCompositionAction
        if (action.type === "pointer") return action as MouseCompositionAction
        throw Error("Type not supported.")
    }

    addAction(
        action:
            | KeyboardCompositionAction
            | MouseCompositionAction
            | PauseCompositionAction
    ) {
        this.actions.push(this.asInteraction(action))
    }

    async perform(compositeActions?: (KeyboardCompositionAction | MouseCompositionAction | PauseCompositionAction)[]) {
        const actions = compositeActions || this.actions

        for (const actionSet of actions) {
            await browser.performActions([actionSet])
        }

        await browser.releaseActions()

        this.actions = []
    }
}

/**
 * NOTE: only works for W3C compatible browsers
 * The user-facing API for emulating complex user gestures.
 * Use this class rather than using the Keyboard or Mouse directly.
 * Implements the builder pattern: Builds a CompositeAction containing all actions specified by the method calls.
 * Call perform() at the end of the method chain to actually perform the actions.
 */
export class Actions {
    private static compositeActions = new CompositeAction()
    private static actions: (
        | KeyboardCompositionAction
        | MouseCompositionAction
        | PauseCompositionAction
    )[] = []

    /**
     * Generates a composite action containing all actions so far, ready to be performed (and resets the internal builder state, so subsequent calls to this method will contain fresh sequences).
     */
    public static build() {
        Actions.actions = Actions.compositeActions.actions
        Actions.compositeActions = new CompositeAction()
        return Actions.actions
    }

    /**
     * Clicks at the current mouse location.
     */
    public static click(): typeof Actions
    /**
     * Clicks in the middle of the given element.
     */
    public static click(target: WebdriverIO.Element): typeof Actions
    public static click(target?: WebdriverIO.Element): typeof Actions {
        if (typeof target !== "undefined") {
            Actions.moveToElement(target)
        }

        Actions.compositeActions.addAction({
            type: "pointer",
            id: "click",
            parameters: { pointerType: "mouse" },
            actions: [
                { type: "pointerDown", button: 0 },
                { type: "pointerUp", button: 0 },
            ],
        })

        return Actions
    }

    /**
     * Clicks (without releasing) at the current mouse location.
     */
    public static clickAndHold(): typeof Actions
    /**
     * Clicks (without releasing) in the middle of the given element.
     */
    public static clickAndHold(target: WebdriverIO.Element): typeof Actions
    public static clickAndHold(target?: WebdriverIO.Element): typeof Actions {
        if (typeof target !== "undefined") {
            Actions.moveToElement(target)
        }

        Actions.compositeActions.addAction({
            type: "pointer",
            id: "clickAndHold",
            parameters: { pointerType: "mouse" },
            actions: [{ type: "pointerDown", button: 0 }],
        })

        return Actions
    }

    /**
     * Performs a context-click at the current mouse location.
     */
    public static contentClick(): typeof Actions
    /**
     * Performs a context-click at middle of the given element.
     */
    public static contentClick(target: WebdriverIO.Element): typeof Actions
    public static contentClick(target?: WebdriverIO.Element) {
        if (typeof target !== "undefined") {
            Actions.moveToElement(target)
        }

        Actions.compositeActions.addAction({
            type: "pointer",
            id: "contentClick",
            parameters: { pointerType: "mouse" },
            actions: [
                { type: "pointerDown", button: 2 },
                { type: "pointerUp", button: 2 },
            ],
        })

        return Actions
    }

    /**
     * Performs a double-click at the current mouse location.
     */
    public static doubleClick(): typeof Actions
    /**
     * Performs a double-click at middle of the given element.
     */
    public static doubleClick(target: WebdriverIO.Element): typeof Actions
    public static doubleClick(target?: WebdriverIO.Element) {
        if (typeof target !== "undefined") {
            Actions.moveToElement(target)
        }

        Actions.compositeActions.addAction({
            type: "pointer",
            id: "doubleClick",
            parameters: { pointerType: "mouse" },
            actions: [
                { type: "pointerDown", button: 0 },
                { type: "pointerUp", button: 0 },
                { type: "pointerDown", button: 0 },
                { type: "pointerUp", button: 0 },
            ],
        })

        return Actions
    }

    /**
     * A convenience method that performs click-and-hold at the location of the source element, moves to the location of the target element, then releases the mouse.
     */
    public static dragAndDrop(
        source: WebdriverIO.Element,
        target: WebdriverIO.Element
    ): typeof Actions {
        Actions.compositeActions.addAction({
            type: "pointer",
            id: "dragAndDrop",
            parameters: { pointerType: "mouse" },
            actions: [
                {
                    type: "pointerMove",
                    duration: 0,
                    origin: source,
                    x: 0,
                    y: 0,
                },
                { type: "pointerDown", button: 0 },
                { type: "pointerMove", origin: target, x: 0, y: 0 },
                { type: "pointerUp", button: 0 },
            ],
        })

        return Actions
    }

    /**
     * A convenience method that performs click-and-hold at the location of the source element, moves by a given offset, then releases the mouse.
     */
    public static dragAndDropBy(
        source: WebdriverIO.Element,
        x: number,
        y: number
    ): typeof Actions {
        Actions.compositeActions.addAction({
            type: "pointer",
            id: "dragAndDrop",
            parameters: { pointerType: "mouse" },
            actions: [
                { type: "pointerMove", origin: source, x: 0, y: 0 },
                { type: "pointerDown", button: 0 },
                { type: "pointerMove", x, y },
                { type: "pointerUp", button: 0 },
            ],
        })

        return Actions
    }

    /**
     * Performs a modifier key press.
     */
    public static keyDown(keys: string): typeof Actions
    /**
     * Performs a modifier key press after focusing on an element.
     */
    public static keyDown(
        target: WebdriverIO.Element,
        keys: string
    ): typeof Actions
    public static keyDown(target: unknown, key?: string): typeof Actions {
        if (typeof key === "undefined") {
            [key, target] = [target as string, key]
        }

        if (typeof target !== "undefined") {
            Actions.moveToElement(target as WebdriverIO.Element)
        }

        Actions.compositeActions.addAction({
            type: "key",
            id: "keyDown",
            actions: [{ type: "keyDown", value: key }],
        })

        return Actions
    }

    /**
     * Performs a modifier key press.
     */
    public static keyUp(keys: string): typeof Actions
    /**
     * Performs a modifier key press after focusing on an element.
     */
    public static keyUp(
        target: WebdriverIO.Element,
        keys: string
    ): typeof Actions
    public static keyUp(target: unknown, key?: string): typeof Actions {
        if (typeof key === "undefined") {
            [key, target] = [target as string, key]
        }

        if (typeof target !== "undefined") {
            Actions.moveToElement(target as WebdriverIO.Element)
        }

        Actions.compositeActions.addAction({
            type: "key",
            id: "keyUp",
            actions: [{ type: "keyUp", value: key }],
        })

        return Actions
    }

    /**
     * Moves the mouse from its current position (or 0,0) by the given offset.
     */
    public static moveByOffset(x: number, y: number): typeof Actions {
        Actions.compositeActions.addAction({
            type: "pointer",
            id: "moveByOffset",
            parameters: { pointerType: "mouse" },
            actions: [{ type: "pointerMove", x, y }],
        })

        return Actions
    }

    /**
     * Moves the mouse to the middle of the element.
     */
    public static moveToElement(target: WebdriverIO.Element): typeof Actions
    /**
     * Moves the mouse to an offset from the element's in-view center point.
     */
    public static moveToElement(
        target: WebdriverIO.Element,
        x: number,
        y: number
    ): typeof Actions
    public static moveToElement(
        target: WebdriverIO.Element,
        x?: number,
        y?: number
    ): typeof Actions {
        Actions.compositeActions.addAction({
            type: "pointer",
            id: "moveToElement",
            parameters: { pointerType: "mouse" },
            actions: [
                { type: "pointerMove", origin: target, x: x || 0, y: y || 0 },
            ],
        })

        return Actions
    }

    /**
     * Performs a pause.
     */
    public static pause(duration: number): typeof Actions {
        Actions.compositeActions.addAction({
            type: null,
            id: "pause",
            actions: [{ type: "pause", duration }],
        })

        return Actions
    }

    /**
     * A convenience method for performing the actions without calling build() first.
     */
    public static async perform() {
        if (Actions.actions.length > 0) {
            await Actions.compositeActions.perform(Actions.build())
            Actions.actions = []
            return;
        }
        await Actions.compositeActions.perform()
    }

    /**
     * Releases the depressed left mouse button at the current mouse location.
     */
    public static release(): typeof Actions
    /**
     * Releases the depressed left mouse button, in the middle of the given element.
     */
    public static release(target: WebdriverIO.Element): typeof Actions
    public static release(target?: WebdriverIO.Element): typeof Actions {
        if (typeof target !== "undefined") {
            Actions.moveToElement(target)
        }

        Actions.compositeActions.addAction({
            type: "pointer",
            id: "release",
            parameters: { pointerType: "mouse" },
            actions: [{ type: "pointerUp", button: 0 }],
        })

        return Actions
    }

    /**
     * Sends keys to the active element.
     */
    public static sendKeys(keys: string): typeof Actions
    /**
     * Equivalent to calling: Actions.click(element).sendKeys(keysToSend).
     */
    public static sendKeys(
        target: WebdriverIO.Element,
        keys: string
    ): typeof Actions
    public static sendKeys(target: unknown, keys?: string): typeof Actions {
        if (typeof keys === "undefined") {
            [keys, target] = [target as string, keys]
        }

        const actions: (KeyDownAction | KeyUpAction)[] = []

        if (typeof target !== "undefined") {
            Actions.moveToElement(target as WebdriverIO.Element).click()
        }

        for (const key of keys) {
            actions.push({
                type: "keyDown",
                value: key,
                origin: target as WebdriverIO.Element,
            })
            actions.push({
                type: "keyUp",
                value: key,
                origin: target as WebdriverIO.Element,
            })
        }

        Actions.compositeActions.addAction({
            type: "key",
            id: "sendKeys",
            actions,
        })

        return Actions
    }
}
