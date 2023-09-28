//Can not convert to typescript because of the MDXComponents being used in the docusaurus theme

import LiteYouTubeEmbed from 'react-lite-youtube-embed'
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
// custom components
import { CreateProjectAnimation, CreateMacOSProjectAnimation } from '../components/CreateProjectAnimation.tsx'
import { ImageSwitcher } from '../components/ImageSwitcher.tsx'
import { CreateFlowcharts } from '../components/CreateFlowcharts.tsx'
import Card from './card.tsx'

export default {
    // Re-use the default mapping
    ...MDXComponents,
    Tabs,
    TabItem,
    ImageSwitcher,
    LiteYouTubeEmbed,
    CreateProjectAnimation,
    CreateMacOSProjectAnimation,
    CreateFlowcharts,
    Card
}
