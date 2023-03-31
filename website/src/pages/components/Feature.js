import React from 'react'
import clsx from 'clsx'
import styles from './Feature.module.css'

export default function Feature({ title, description, icon }) {
    return (
        <div className={clsx(styles.feature)}>
            <div className={clsx(styles.icon)}>{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}
