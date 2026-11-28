import type { TreeNode } from '../../src/tree.js'

/**
 * `device.dump.ui` of the Settings app on an iOS simulator (mobilecli
 * 1.0.23), shortened
 */
export const IOS_TREE: TreeNode[] = [{
    ref: '@e1',
    type: 'NavigationBar',
    name: 'Settings',
    identifier: 'Settings',
    rect: { x: 0, y: 62, width: 402, height: 106 },
    children: [{
        ref: '@e2',
        type: 'StaticText',
        label: 'Settings',
        name: 'Settings',
        rect: { x: 16, y: 119, width: 133, height: 40 }
    }]
}, {
    ref: '@e3',
    type: 'CollectionView',
    name: 'com.apple.settings.sidebar.collectionView',
    identifier: 'com.apple.settings.sidebar.collectionView',
    rect: { x: 0, y: 0, width: 402, height: 874 },
    children: [{
        ref: '@e4',
        type: 'Button',
        label: 'General',
        name: 'com.apple.settings.general',
        identifier: 'com.apple.settings.general',
        rect: { x: 16, y: 293, width: 370, height: 52 },
        children: [{
            ref: '@e5',
            type: 'StaticText',
            label: 'General',
            name: 'General',
            rect: { x: 30, y: 305, width: 101, height: 28 }
        }, {
            ref: '@e6',
            type: 'Image',
            name: 'chevron.forward',
            identifier: 'chevron.forward',
            rect: { x: 360, y: 313, width: 7, height: 12 }
        }]
    }, {
        ref: '@e7',
        type: 'Button',
        label: 'Accessibility',
        name: 'com.apple.settings.accessibility',
        identifier: 'com.apple.settings.accessibility',
        rect: { x: 16, y: 345, width: 370, height: 52 },
        children: [{
            ref: '@e8',
            type: 'StaticText',
            label: 'Accessibility',
            name: 'Accessibility',
            rect: { x: 30, y: 357, width: 136, height: 28 }
        }, {
            ref: '@e9',
            type: 'Image',
            name: 'chevron.forward',
            identifier: 'chevron.forward',
            rect: { x: 360, y: 365, width: 7, height: 12 }
        }]
    }]
}]

/**
 * A login screen on Android, with the fields that mobilecli fills from a
 * node: `type` is the class, `label` the `content-desc`, `identifier` the
 * `resource-id` (`toScreenElement` in `mobilecli/devices/android.go`)
 */
export const ANDROID_TREE: TreeNode[] = [{
    ref: '@e1',
    type: 'android.widget.FrameLayout',
    text: '',
    identifier: 'android:id/content',
    rect: { x: 0, y: 0, width: 1080, height: 2424 },
    children: [{
        ref: '@e2',
        type: 'android.widget.TextView',
        text: 'Login',
        identifier: 'com.example.app:id/title',
        rect: { x: 48, y: 200, width: 984, height: 96 }
    }, {
        ref: '@e3',
        type: 'android.widget.EditText',
        text: '',
        label: 'username',
        placeholder: 'Username',
        identifier: 'com.example.app:id/username',
        clickable: true,
        rect: { x: 48, y: 360, width: 984, height: 144 }
    }, {
        ref: '@e4',
        type: 'android.widget.EditText',
        text: '',
        label: 'password',
        placeholder: 'Password',
        identifier: 'com.example.app:id/password',
        clickable: true,
        rect: { x: 48, y: 540, width: 984, height: 144 }
    }, {
        ref: '@e5',
        type: 'android.view.ViewGroup',
        text: '',
        label: 'login',
        identifier: 'com.example.app:id/login',
        clickable: true,
        rect: { x: 48, y: 760, width: 984, height: 144 },
        children: [{
            ref: '@e6',
            type: 'android.widget.TextView',
            text: 'Log in',
            rect: { x: 420, y: 800, width: 240, height: 64 }
        }]
    }]
}]
