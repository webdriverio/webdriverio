import LiteYouTubeEmbed from 'react-lite-youtube-embed'
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
// custom components
import { CreateProjectAnimation, CreateMacOSProjectAnimation } from '../components/CreateProjectAnimation.js'
import { ImageSwitcher } from '../components/ImageSwitcher.js'

export default {
    // Re-use the default mapping
    ...MDXComponents,
    Tabs,
    TabItem,
    ImageSwitcher,
    LiteYouTubeEmbed,
    CreateProjectAnimation,
    CreateMacOSProjectAnimation,
}
