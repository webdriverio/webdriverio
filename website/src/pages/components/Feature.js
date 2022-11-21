import React from 'react'
import clsx from 'clsx'
import styles from './Feature.module.css'

export default function Features ({ features }) {
    return (
        <div className={clsx(styles.features)}>
            {features.map((props, idx) => (
                <Feature key={idx} {...props} />
            ))}
        </div>
    )
}

export function Feature({ title, description, icon }) {
    return (
        <div className={clsx(styles.feature)}>
            <div className={clsx(styles.icon)}>{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}
