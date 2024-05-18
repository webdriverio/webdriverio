import { Component as foo, Prop, Host } from '@stencil/core'

@foo({
    tag: 'nested-component',
    shadow: true,
})
export class NestedComponent {
    @Prop() id?: string

    render() {
        return (
            <Host>
                <i>
                    I am a {this.id || 'unknown'}!
                </i>
                <a href="#">I am a link</a>
            </Host>
        )
    }
}
