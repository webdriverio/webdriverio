export default async function getWindowHandle () {
    return Array.from(this.windows.keys())
}
