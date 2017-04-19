import merge from 'deepmerge'

const BUILD_ENV = (process.env.npm_lifecycle_event || '').split(':').pop()
let labels = {
    BUILD_ENV,
    NATIVE_APP_CONTEXT: 'NATIVE_APP'
}

if (BUILD_ENV === 'android') {
    labels = merge(labels, {
        WEBVIEW_CONTEXT: 'WEBVIEW_io.webdriver.guineapig',
        ACTIVITY: '.MainActivity',
        HITAREA: '//android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.webkit.WebView[1]/android.webkit.WebView[1]/android.widget.ListView[1]'
    })
}

if (BUILD_ENV === 'ios') {
    labels = merge(labels, {
        WEBVIEW_CONTEXT: 'WEBVIEW_',
        HITAREA: '//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIAStaticText[9]'
    })
}

export default labels
