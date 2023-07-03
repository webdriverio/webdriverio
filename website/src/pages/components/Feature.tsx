import React from 'react'
import clsx from 'clsx'
import styles from './Feature.module.css'
import type { FC, ReactNode } from 'react'

type FeatureProps = {
    title: string
    description: string
    icon: ReactNode
}

const Feature: FC<FeatureProps> = ({ title, description, icon }) => (
    <div className={clsx(styles.feature)}>
        <div className={clsx(styles.icon)}>{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
)

export default Feature
