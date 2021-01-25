import React from 'react'
import clsx from 'clsx'
import styles from './LogoCarousel.module.css'

const INTERVAL_LENGTH = 5000

let ticks = 0

export default class LogoCarousel extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            position: -0,
            activePage: 0,
            swapInterval: 0
        }

        this.containerRef = React.createRef()
        this.pages = Math.ceil(props.logos ? props.logos.length / 6 : 1)
    }

    componentDidMount() {
        this.setState({
            swapInterval: setInterval(this.nextPage.bind(this), INTERVAL_LENGTH)
        })
    }

    componentWillUnmount () {
        clearInterval(this.state.swapInterval)
    }

    animateTo (i) {
        const width = this.containerRef.current.getBoundingClientRect().width - 70 // 50px = margin
        const x = i * -width
        this.setState({ position: x, activePage: i })
    }

    handleClick (i) {
        this.animateTo(i)
        clearInterval(this.state.swapInterval)
        this.setState({
            swapInterval: setInterval(this.nextPage.bind(this), INTERVAL_LENGTH)
        })
    }

    nextPage () {
        const pages = this.pages - 1
        const direction = Math.floor(ticks / pages) % 2
        this.animateTo(direction
            ? pages - (ticks % pages)
            : ticks % pages
        )
        ++ticks
    }

    render () {
        if (!this.props || !this.props.logos) {
            return (
                <div></div>
            )
        }

        this.buttons = () => [...Array(this.pages)].map((_, index) => (
            <button onClick={() => this.handleClick(index)} key={index} className={clsx(styles.button, index === this.state.activePage ? styles.buttonActive : '')}>{index + 1}</button>
        ))

        this.list = () => (
            <ul style={{ transform: `translate(${this.state.position}px, 0px)` }}>
                {this.props.logos.map((value, index) => (
                    <li key={index}><a href={value.url} target="_blank"><img src={'/img/logos/' + value.img} alt={value.alt} /></a></li>
                ))}
            </ul>
        )

        return (
            <div className={styles.companyUsage} ref={this.containerRef}>
                <h3>Who is using WebdriverIO?</h3>
                <div className={clsx(styles.logos)}>
                    {this.list()}
                    <div className={styles.logoNavigation}>
                        {this.buttons()}
                    </div>
                </div>
            </div>
        )
    }
}
