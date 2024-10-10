import { Component } from '@stencil/core'

@Component({
    tag: 'scoped-component',
    scoped: true
})
export class ScopedComponent {
    render() {
        return (
            <input type="text" value="Hello World!" />
        )
    }
}
