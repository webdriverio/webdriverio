import { Component, Prop } from '@stencil/core'
import { MatchResults } from '@stencil-community/router'

@Component({
    tag: 'app-profile',
    styleUrl: 'stencil.css',
    shadow: true,
})
export class AppProfile {
    @Prop() match?: MatchResults

    normalize(name?: string): string {
        if (name) {
            return name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
        }
        return ''
    }

    render() {
        return (
            <div className="app-profile">
                <p>Hello! My name is {this.normalize(this.match?.params.name)}.</p>
                {/* @ts-ignore: types don't exist as we don't compile the components with Stencil */}
                <nested-component id="nested component"></nested-component>
            </div>
        )
    }
}
