import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../constants'

export default async function getWindowRect () {
    const page = this.windows.get(this.currentWindowHandle)
    const viewport = await page.viewport() || {}
    return Object.assign(
        { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, x: 0, y: 0 },
        viewport
    )
}
