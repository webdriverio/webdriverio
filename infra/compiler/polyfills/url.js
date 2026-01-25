// URL module polyfill - uses native browser URL APIs
export const URL = globalThis.URL
export const URLSearchParams = globalThis.URLSearchParams

/**
 * Converts a file URL to a file system path.
 * @param {string|URL} url - The file URL to convert
 * @returns {string} The file system path
 */
export const fileURLToPath = (url) => {
    let pathname
    let urlObj

    // Handle URL objects
    if (typeof url === 'object' && url !== null && url.pathname !== undefined) {
        // Strict protocol check - must be exactly 'file:'
        if (url.protocol !== 'file:') {
            throw new TypeError('The URL must be of scheme file')
        }
        // Validate host is empty or localhost
        if (url.host && url.host.toLowerCase() !== 'localhost') {
            throw new TypeError(`File URL host must be "localhost" or empty on this platform, got "${url.host}"`)
        }
        pathname = url.pathname
    } else if (typeof url === 'string') {
        // Validate file: scheme
        if (!url.startsWith('file:')) {
            throw new TypeError('The URL must be of scheme file')
        }
        // Parse with URL constructor to properly handle hosts
        try {
            urlObj = new URL(url)
        } catch {
            throw new TypeError('Invalid URL: ' + url)
        }
        // Validate protocol
        if (urlObj.protocol !== 'file:') {
            throw new TypeError('The URL must be of scheme file')
        }
        // Validate host is empty or localhost
        if (urlObj.host && urlObj.host.toLowerCase() !== 'localhost') {
            throw new TypeError(`File URL host must be "localhost" or empty on this platform, got "${urlObj.host}"`)
        }
        pathname = urlObj.pathname
    } else {
        throw new TypeError('The "url" argument must be of type string or URL')
    }

    // Decode percent-encoded characters (%XX sequences) with error handling
    try {
        pathname = decodeURIComponent(pathname)
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        throw new URIError(`Invalid percent-encoding in pathname: "${pathname}" - ${error.message}`)
    }

    // Handle Windows drive letters: /C:/path -> C:/path
    // Only strip leading slash if followed by a drive letter
    if (/^\/[A-Za-z]:/.test(pathname)) {
        pathname = pathname.substring(1)
    }

    return pathname
}

/**
 * Converts a file system path to a file URL.
 * Handles Windows paths, percent-encodes special characters.
 * @param {string} path - The file path to convert
 * @returns {URL} The file URL
 */
export const pathToFileURL = (path) => {
    if (typeof path !== 'string') {
        throw new TypeError('The "path" argument must be of type string')
    }

    // Normalize Windows backslashes to forward slashes
    let normalizedPath = path.replace(/\\/g, '/')

    // Ensure Windows drive letters have a leading slash
    // C:/path -> /C:/path
    if (/^[A-Za-z]:/.test(normalizedPath)) {
        normalizedPath = '/' + normalizedPath
    }

    // Percent-encode special URL characters in each path segment
    // Characters to encode: space, #, ?, %, control characters, non-ASCII
    const encodedPath = normalizedPath
        .split('/')
        .map(segment => {
            // Encode characters that have special meaning in URLs
            return segment
                .replace(/%/g, '%25')     // Must be first
                .replace(/#/g, '%23')
                .replace(/\?/g, '%3F')
                .replace(/ /g, '%20')
                .replace(/\[/g, '%5B')
                .replace(/\]/g, '%5D')
        })
        .join('/')

    // Create URL object with properly encoded path
    const url = new URL('file://')
    url.pathname = encodedPath
    return url
}

export default { URL, URLSearchParams, fileURLToPath, pathToFileURL }
