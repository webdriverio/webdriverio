import React from 'react'
import Head from '@docusaurus/Head'
import Content from '@theme-original/DocItem/Content'
import type ContentType from '@theme/DocItem/Content'
import type { WrapperProps } from '@docusaurus/types'

import PageActions, { useMarkdownUrl } from '../../../components/PageActions/index.tsx'

type Props = WrapperProps<typeof ContentType>

export default function ContentWrapper (props: Props) {
    const { markdownUrl } = useMarkdownUrl()
    return (
        <>
            <Head>
                <link rel="alternate" type="text/markdown" href={markdownUrl} />
            </Head>
            <PageActions />
            <Content {...props} />
        </>
    )
}
