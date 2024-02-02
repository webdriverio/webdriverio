import { Component as foo, Prop } from '@stencil/core'

@foo({
    tag: 'nested-component',
    shadow: true,
})
export class NestedComponent {
    @Prop() id?: string

    render() {
        return (
            <i>
                I am a {this.id || 'unknown'}!
            </i>
        )
    }
}
