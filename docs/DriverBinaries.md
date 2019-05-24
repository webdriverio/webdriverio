---
id: driverbinaries
title: Driver Binaries
---

WebdriverIO allows using driver binaries directly instead of services. Here is an example with geckodriver

### Download Geckodriver

**Note: You must have [Firefox](https://www.mozilla.org/en-US/firefox/new/) installed to use Geckodriver.**

Download the latest version of geckodriver for your environment and unpack it in your project directory:

**Linux 64 bit**

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-linux64.tar.gz | tar xz
```

**OSX**

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-macos.tar.gz | tar xz
```

or with [brew](https://brew.sh/)

```sh
$ brew install geckodriver
```

**Windows 64 bit**

Simple setup: ([Chocolatey](https://chocolatey.org/))
```sh
choco install selenium-gecko-driver
```

For advanced users (Powershell):
```sh
# Run as privileged session. Right-click and set 'Run as Administrator'
# Use geckodriver-v0.24.0-win32.zip for 32 bit Windows
$url = "https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-win64.zip"
$output = "geckodriver.zip" # will drop into current directory unless defined otherwise
$unzipped_file = "geckodriver" # will unzip to this folder name

# By default, Powershell uses TLS 1.0 the site security requires TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Downloads Geckodriver
Invoke-WebRequest -Uri $url -OutFile $output

# Unzip Geckodriver
Expand-Archive $output -DestinationPath $unzipped_file
cd $unzipped_file

# Globally Set Geckodriver to PATH
[System.Environment]::SetEnvironmentVariable("PATH", "$Env:Path;$pwd\geckodriver.exe", [System.EnvironmentVariableTarget]::Machine)
```

Note: Other geckodriver releases are available [here](https://github.com/mozilla/geckodriver/releases). In order to automate other browser you need to run different drivers. You can find a list with all drivers in the [awesome-selenium](https://github.com/christian-bromann/awesome-selenium#driver) readme.

### Start Browser Driver

Start Geckodriver by running:

```sh
$ /path/to/binary/geckodriver --port 4444
```

For example, if you ran the curl command from above, you should have a `geckodriver` binary available in the current folder. You can run the following to start it:


```sh
$ ./geckodriver --port 4444
```

This will start Geckodriver on `localhost:4444` with the WebDriver endpoint set to `/`.

Keep this running in the background and open a new terminal window. Next step is to download WebdriverIO via NPM:

### Configure the path

If you are using driver's binary directly like geckodriver or chromedriver, the 'path' to it is different from the expected default (which is `/wd/hub`). To change that, we need to edit the `wdio.conf.js` file, add a section to specify the path:

```
    path: '/',
```

So the top of your file should look like:

```
exports.config = {
    runner: 'local',
    //
    // Uncomment line below to override default path ('/wd/hub') for usage of driver binary directly, ex: chromedriver or geckodriver.
    path: '/',
}
```

Be sure to save the file after your changes.
