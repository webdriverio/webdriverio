import edgeFinder from './edge.js'
import firefoxFinder from './firefox.js'

export default (browserName: 'firefox' | 'edge', platform: NodeJS.Platform) => {
    const finder = {
        firefox: firefoxFinder,
        edge: edgeFinder
    }[browserName]

    const supportedPlatforms = Object.keys(finder) as NodeJS.Platform[]
    if (!supportedPlatforms.includes(platform)) {
        throw new Error(`Operating system ("${process.platform}") is not supported`)
    }

    return finder[platform as keyof typeof finder]
}
