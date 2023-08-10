import { Component, Method, Prop, State, Watch } from '@stencil/core'

interface PointOfInterest {
    id: string
    name: string
    description: string
    location: {
        lat: number
        lng: number
    }
}

/**
 * Component to render map
 *
 * @export
 * @class MyComponent
 */
@Component({
    tag: 'my-component',
    styleUrl: 'my-component.css',
    shadow: true
})
export class MyComponent {

    /**
     * Input name prop
     *
     * @type {string}
     * @memberof MyComponent
     */
    @Prop() public name: string = 'Stencil'

    /**
     * The view mode of the map
     *
     * @type {ViewMode}
     * @memberof MyComponent
     */
    @State() public viewMode: string = 'List'

    /**
     * list of visited PointsOfInterest
     *
     * @type {PointOfInterest[]}
     * @memberof MyComponent
     */
    @State() public pointsOfInterest: PointOfInterest[] = []

    /**
     * Sets list of visited PointsOfInterest
     *
     * @param {{ key: boolean }} pointsOfInterest
     * @memberof MyComponent
     */
    @Method()
    public async setPointsOfInterest(pointsOfInterest: PointOfInterest[]) {
        this.pointsOfInterest = pointsOfInterest
    }
    public componentWillLoad() {
        console.log('The component is about to be rendered')
    }
    public componentDidLoad() {
        console.log('The component has been rendered')
    }
    public componentWillUpdate() {
        console.log('The component will update')
    }
    public componentDidUpdate() {
        console.log('The component did update')
    }
    public componentDidUnload() {
        console.log('The view has been removed from the DOM')
    }

    @Watch('name')
    public watchHandler(newValue: unknown) {
        console.log('The value of name is: ', newValue)
    }

    /**
     * Sets the view mode of the map
     *
     * @param {ViewMode} viewMode
     * @memberof MyComponent
     */
    @Method()
    public async setViewMode(viewMode: string) {
        this.viewMode = viewMode
    }

    public render() {
        return (
            <div>
                <h1>Hi {this.name}</h1>
                <div>View Mode: {this.viewMode}</div>
                <div>Visited PointsOfInterest:
                    {this.pointsOfInterest.map((poi) => {
                        return <div key={poi.id}>
                            {poi.id}
                        </div>
                    })}
                </div>
            </div>
        )
    }
}
