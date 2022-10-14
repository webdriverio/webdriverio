import { h } from 'preact'
import { useState } from 'preact/hooks'

export function Counter({ initialCount }) {
    const [count, setCount] = useState(initialCount)
    const increment = () => setCount(count + 1)

    return (
        <div>
            Current value: {count}
            <button onClick={increment}>Increment</button>
        </div>
    )
}
