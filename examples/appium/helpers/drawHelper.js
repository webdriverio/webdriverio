/** @typedef {{ x: number, y: number }} Point */

const h = 200
const k = 450
const r = 100

/**
 * draw strokes at the same time, one touch pointer (finger) per stroke
 * @param  {WebdriverIO.Browser} driver   session to draw with
 * @param  {...Point[]}          strokes  absolute points of each stroke
 */
export function draw (driver, ...strokes) {
    return driver.actions(strokes.map(([start, ...rest]) => {
        const finger = driver.action('pointer', { parameters: { pointerType: 'touch' } })
            .move(start)
            .down()
        for (const point of rest) {
            finger.move({ ...point, duration: 10 })
        }
        return finger.up()
    }))
}

/**
 * simple helper function to draw a circle
 * @param  {number} h    horizontal center of the circle
 * @param  {number} k    vertical center of the circle
 * @return {Point[]}     points of the circle
 */
export function circlePoints (h, k) {
    const points = []
    for (let theta = 0; theta < 2 * Math.PI; theta += 2 * Math.PI / 36) {
        points.push({ x: Math.round(h + r * Math.cos(theta)), y: Math.round(k + r * Math.sin(theta)) })
    }
    return points
}

/**
 * helper function to draw an arc
 * @param  {number} start start point
 * @param  {number} end   end point
 * @return {Point[]}      points of the arc
 */
export function arcPoints (start, end) {
    const points = []
    for (let theta = start; theta < end; theta += 2 * Math.PI / 100) {
        points.push({ x: Math.round(h + r * Math.cos(theta)), y: Math.round(k + r * Math.sin(theta)) })
    }
    return points
}

/**
 * helper function to draw an curved arc
 * @param  {number} start start point
 * @param  {number} end   end point
 * @return {Point[]}      points of the curved arc
 */
export function innerArcPoints (start, end) {
    const points = []
    for (let theta = start; theta < end; theta += 4 * Math.PI / 100) {
        const rad = 7.5991 * Math.pow(theta - start - Math.PI, 2) + 25
        points.push({ x: Math.round(h - rad * Math.cos(theta)), y: Math.round(k + rad * Math.sin(theta)) })
    }
    return points
}
