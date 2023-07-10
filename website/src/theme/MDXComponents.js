import LiteYouTubeEmbed from 'react-lite-youtube-embed'
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
// custom components
import { CreateProjectAnimation, CreateMacOSProjectAnimation } from '../pages/components/CreateProjectAnimation.js'

export default {
    // Re-use the default mapping
    ...MDXComponents,
    Tabs,
    TabItem,
    LiteYouTubeEmbed,
    CreateProjectAnimation,
    CreateMacOSProjectAnimation,
}
