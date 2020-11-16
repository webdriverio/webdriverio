export default function createWindow (url: string, features: string) {
    return window.open(url, '_blank', features)
}
