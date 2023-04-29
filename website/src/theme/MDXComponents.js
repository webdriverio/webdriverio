import LiteYouTubeEmbed from 'react-lite-youtube-embed'
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents'
// custom components
import CreateProjectAnimation from '../pages/components/CreateProjectAnimation.js'

export default {
    // Re-use the default mapping
    ...MDXComponents,
    LiteYouTubeEmbed,
    CreateProjectAnimation,
}
