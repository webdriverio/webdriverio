export default async function getWindowHandles () {
    return Array.from(this.windows.keys())
}
