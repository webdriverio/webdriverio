name: webdriverrtc
category: plugins
tags: guide
index: 2
title: WebdriverRTC
---

WebdriverRTC
============

This project is an extension to [WebdriverIO](http://webdriver.io) and enables your client instance to grep statistical data from a running WebRTC peer connection. According to the [w3 WebRTC draft](http://www.w3.org/TR/webrtc/#dom-peerconnection-getstats) all `RTCPeerConnection` objects provide a method called [`getStats`](http://www.w3.org/TR/webrtc/#widl-RTCPeerConnection-getStats-void-MediaStreamTrack-selector-RTCStatsCallback-successCallback-RTCPeerConnectionErrorCallback-failureCallback) which returns a [`RTCStats`](http://www.w3.org/TR/webrtc/#idl-def-RTCStats) object with useful information about things like packet losts or the audio input level which can be helpful in order to test your network connection or environment (e.g. did my "Mute" button really work?).

This means that you can access all statistical data from `chrome://webrtc-internals` using Selenium as part of your integration tests.

![chrome-internals](http://www.christian-bromann.com/webrtc-internals.png)

## Prerequisites

To use WebdriverRTC you need at least WebdriverIO `>=v4`

## How does it work

WebdriverRTC masquerades the url command and injects a script after the page has been loaded to overwrite the standard `RTCPeerConnection` interface and get access to all created `RTCPeerConnection` objects. After you start analyzing it repeats calling the `getStats` method with a specific interval and saves all results to an internal object lying in the window scope. Then you can use WebdriverRTC commands to access these information. Currently only the Chrome browser is supported. But there's more to come.

## Example

First install WebdriverRTC via NPM:

```sh
$ npm install webdriverrtc
```

Then enhance your client instance using the `init` method:

```js
// init WebdriverIO
var matrix = require('webdriverio').multiremote({
    'browserA': {
        desiredCapabilities: {
            browserName: 'chrome'
        }
    },
    'browserB': {
        desiredCapabilities: {
            browserName: 'chrome'
        }
    }
});

var WebdriverRTC = require('webdriverrtc');
WebdriverRTC.init(matrix,  {
    browser: 'browserA' // define browser that collects data
});
```

Now start your selenium session and do everything required to establish a WebRTC connection. __Note__ that you need to run WebdriverIO in multiremote mode if you don't have something fancy that autoconnects your browser. Multiremote can be really helpful in these situations where you need to control more then one browser. After the connection was established run `startAnalyzing`, make a pause for a specific amount of time and then grab the stats for that time period.

```js
matrix
    .init()
    .url('https://apprtc.appspot.com/r/' + channel)
    .click('#confirm-join-button')
    .pause(5000)
    .startAnalyzing()
    .getConnectionInformation(function(err, connectionType) {
        console.log(connectionType);
    })
    .pause(10000)
    .getStats(10000, function(err, mean, median, max, min, rawdata) {
        console.log('mean:', mean);
        console.log('median:', median);
        console.log('max:', max);
        console.log('min:', min);
        console.log('rawdata', rawdata); // contains the complete RTCStatsReport with even more information (mostly browser specific)
    })
    .end();
```

## Commands

WebdriverRTC enhances your client with a small amount of new commands in order to use this plugin properly:

### startAnalyzing(<Function>)

Start with WebRTC analyzing. If you want to take stats of a specific RTCPeerConnection object you can use this function to return that object. Also necessary if your app creates an object immediately after the page got loaded.

Example:

```js
browserA.startAnalyzing(function() {
    return appController.call_.pcClient_.pc_;
});
```

### getConnectionInformation(callback)

Get basic information about the connection. Example:

```js
matrix.getConnectionInformation(function(connection) {
    console.log(connection);
    /**
     * returns:
     * {
     *     "transport": "udp",
     *     "remote": {
     *         "candidateType": "local",
     *         "ipAddress": "192.168.1.7",
     *         "port": "52193"
     *     },
     *     "local": {
     *         "candidateType": "local",
     *         "ipAddress": "192.168.1.7",
     *         "port": 55375
     *     }
     * }
     */
});
```

### getStats(duration)

Returns all stats within given duration in different formats.

#### duration
You can specify a specific time frame in which you want to receive the stats. If you pass in a number you will receive stats within the last x (your number) ms. You can also be more specific and pass in an object with `from` and `to` attributes and desired timestamps as value respectively. If you pass in null, you will receive the last taken stat trace.

Type: *Number|Object*<br>

```js
matrix
    .pause(10000)
    .getStats(10000).then(function(mean) {
        /**
         * this test would fail if you are too loud during the test ;-)
         */
        assert.ok(max.audio.outbound.inputLevel < 1000, 'You are too loud!');
        expect(video.rtt).to.be.within(0, 15);
    });
```

This is how an example result object does look like:

```json
{
    "audio": {
        "inbound": {
            "bytesReceived": 31431,
            "jitter": 0.5,
            "packetsReceived": 295.83,
            "packetsLost": 0,
            "outputLevel": 8112.5
        },
        "outbound": {
            "jitter": 0.83,
            "rtt": 1.5,
            "packetsLost": 0,
            "packetsSent": 297,
            "bytesSent": 30884.33,
            "inputLevel": 465.33
        }
    },
    "video": {
        "captureJitterMs": 25,
        "encodeUsagePercent": 75,
        "frameWidthInput": 640,
        "captureQueueDelayMsPerS": 0.83,
        "bandwidth": {
            "actualEncBitrate": 160375,
            "availableReceiveBandwidth": 325032.67,
            "targetEncBitrate": 154050.5,
            "transmitBitrate": 160351.5,
            "retransmitBitrate": 0,
            "bucketDelay": 6.67,
            "availableSendBandwidth": 154050.5
        },
        "frameRateSent": 16,
        "avgEncodeMs": 8.5,
        "bytesSent": 71676.5,
        "frameWidthSent": 640,
        "frameHeightInput": 480,
        "rtt": 3.17,
        "frameHeightSent": 480,
        "packetsLost": 0,
        "packetsSent": 100,
        "frameRateInput": 14.5
    }
}
```
