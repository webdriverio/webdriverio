const h = 200
const k = 450
const r = 100

/**
 * simple helper function to draw a circle
 * @param  {Number} h    horizontal center of the circle
 * @param  {Number} k    vertical center of the circle
 * @return {Actions[]}   list of actions for touchAction command
 */
export function circleAction (h, k) {
    let theta = 0
    let prev = { action: 'press', x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) }
    const actions = []

    actions.push(prev)
    for (; theta < 2*Math.PI; theta+=2*Math.PI/36) {
        const next = { x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) }
        actions.push({ action: 'moveTo', x: next.x - prev.x, y: next.y - prev.y })
        prev = next
    }

    actions.push('release')
    return actions
}

/**
 * helper function to draw an arc
 * @param  {Number} start start point
 * @param  {Number} end   end point
 * @return {Actions[]}    list of action for touchAction command
 */
export function arcAction(start, end) {
    let theta = start
    let prev = { action: 'press', x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) }
    const actions = []
    actions.push(prev)

    for (; theta < end; theta += 2 * Math.PI / 100) {
        const next = { x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) }
        actions.push({ action: 'moveTo', x: next.x - prev.x, y: next.y - prev.y })
        prev = next
    }

    actions.push('release')
    return actions
}

/**
 * helper function to draw an curved arc
 * @param  {Number} start start point
 * @param  {Number} end   end point
 * @return {Actions[]}    list of action for touchAction command
 */
export function innerArcAction(start, end) {
    let theta = start
    const step = 4 * Math.PI / 100

    let prev = { action: 'press', x: h - r * Math.cos(theta), y: k + r * Math.sin(theta) }
    const actions = []
    actions.push(prev)

    for (; theta < end; theta += step) {
        const rad = 7.5991 * Math.pow(theta - start - Math.PI, 2) + 25
        const next = { x: h - rad * Math.cos(theta), y: k + rad * Math.sin(theta) }
        actions.push({ action: 'moveTo', x: next.x - prev.x, y: next.y - prev.y })
        prev = next
    }

    actions.push('release')
    return actions
}
