import React from 'react'
import clsx from 'clsx'
import styles from './Feature.module.css'
import Feature from './Feature'
import type { FC } from 'react'

type FeatureProps = {
    features: {
        title: string
        text: string
        img: React.ReactNode
    }[]
}

const Features: FC<FeatureProps> = ({ features }) => (
    <div className={clsx(styles.features)}>
        {(features || []).map((props, idx) => (
            <Feature key={idx}
                title={props.title}
                description={props.text}
                icon={props.img}
            />
        ))}
    </div>
)

export default Features
