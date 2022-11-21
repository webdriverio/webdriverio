import React from 'react'
import clsx from 'clsx'
import styles from './LogoCarousel.module.css'

const INTERVAL_LENGTH = 5000
const LOGO_WIDTH = 150

let ticks = 0

export default class LogoCarousel extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            position: -0,
            activePage: 0,
            swapInterval: 0,
            pages: Math.ceil(props.logos ? props.logos.length / 6 : 1),
            margin: 70
        }

        this.containerRef = React.createRef()
    }

    componentDidMount() {
        const rect = this.containerRef.current.getBoundingClientRect()
        const logosPerPage = Math.floor(rect.width / LOGO_WIDTH)
        this.setState({
            swapInterval: setInterval(this.nextPage.bind(this), INTERVAL_LENGTH),
            pages: Math.ceil(this.props.logos ? this.props.logos.length / logosPerPage : 1),
            margin: rect.width < 700 ? 0 : 210
        })
    }

    componentWillUnmount () {
        clearInterval(this.state.swapInterval)
    }

    animateTo (i) {
        const width = this.containerRef.current.getBoundingClientRect().width - this.state.margin
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
        const pages = this.state.pages - 1
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

        this.buttons = () => [...Array(this.state.pages)].map((_, index) => (
            <button onClick={() => this.handleClick(index)} key={index} className={clsx(styles.button, index === this.state.activePage ? styles.buttonActive : '')}>{index + 1}</button>
        ))

        this.list = () => (
            <ul style={{ transform: `translate(${this.state.position}px, 0px)` }}>
                {this.props.logos.map((value, index) => (
                    <li key={index}><a href={value.url} target="_blank" rel="noopener noreferrer"><img src={'/img/logos/' + value.img} alt={value.alt} /></a></li>
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
