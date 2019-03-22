export default async function getWindowRect (connection) {
    const { Browser } = connection

    const { bounds } = await Browser.getWindowForTarget()
    return {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height
    }
}
