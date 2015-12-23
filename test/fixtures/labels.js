import merge from 'deepmerge'

let labels = {
    NATIVE_APP_CONTEXT: 'NATIVE_APP'
}

if (process.env._ENV === 'android') {
    labels = merge(labels, {
        WEBVIEW_CONTEXT: 'WEBVIEW_io.webdriverjs.example',
        ACTIVITY: '.MainActivity',
        HITAREA: '//android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.webkit.WebView[1]/android.webkit.WebView[1]/android.view.View[2]'
    })
} else if (process.env._ENV === 'ios') {
    labels = merge(labels, {
        WEBVIEW_CONTEXT: 'WEBVIEW_1',
        HITAREA: '//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText[9]'
    })
}

export default labels
