<!doctype html>
<html class="no-js" lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

		<title></title>
		<meta name="description" content="">
		<meta name="author" content="">

		<meta name="viewport" content="width=device-width,initial-scale=1">

		<link rel="stylesheet" href="css/style.css">

		<script src="js/libs/modernizr-2.0.6.min.js"></script>
	</head>
	<body>

		<div id="container">
			<header>
				webdriverjs
			</header>
			<div id="main" role="main">
				
				<section class="chapter">
					<h2>intro</h2>
				
					<p>there is one important idea with this project. keep it simple and intuitive. it should be easy as this:</p>
					
					<div class="example">
						<pre>
							<code>
	var client = require("webdriverjs").remote();
	client
		.init()
		.url("http://www.cnn.com")
		.getText("h1")
		.end();
							</code>
						</pre>
						
						<div class="description">
							what does this example do?
							<ol>
								<li>it opens a browser</li>
								<li>it goes to cnn.com</li>
								<li>it gets the content of the first h1</li>
								<li>it closes the browser</li>
							</ol>
						</div>
					</div>
				</section>
				
				<section class="chapter">
					<h2>helper functions</h2>
					
					<p>the helper functions are there to help you. they make it easier to get things</p>
					
					<p>here are the current existing functions</p>
					
					<?php

						if ($handle = opendir('commands')) 
						{
						    echo "Directory handle: $handle\n";
						    echo "Files:\n";

						    while (false !== ($file = readdir($handle))) 
							{
						        echo "$file\n";
						    }

						    closedir($handle);
						}
						
					?>
					
					
					
					<div class="command">
						<pre><code>	click(<span class="attributes">css selector</span>)</code></pre>
						<p>Clicks on an object selected by a css selector.</p>
						<div class="example">
							Example:
							<pre>
								<code>	
	client.click("#firstLink");
								</code>
							</pre>
						</div>
						<div class="example">
							Example in context:
							<pre>
								<code>
	var client = require("webdriverjs").remote();
	client
		.init()
		.url("http://www.cnn.com")
		.click("a")
		.end();
								</code>
							</pre>
					</div>
					<div class="command">
						<pre><code>	end()</code></pre>
						<p>End the session, ie closes the browser.</p>
						<div class="example">
							Example:
							<pre>
								<code>	
	client.end();
								</code>
							</pre>
						</div>
						<div class="example">
							Example in context:
							<pre>
								<code>
								var client = require("webdriverjs").remote();
								client
								   .init()
								   .url("http://www.cnn.com")
								   .end();
								</code>
							</pre>
						</div>
					</div>
				</section>
				
				<section class="chapter">
					<h2>examples</h2>
				</section>
				
				<section class="chapter">
					<h2>protocol</h2>
					
					Behind all helper functions are the protocol binding functions. These functions are directly mapped to the WebDriver wire protocol. With them we can do all good stuff that Webdriver lest us, but they are base functions and need a little more code from us to be used.
					
					Here is a list of all implemented functions. If you want to know more about each function, or read about the ones that are implemented yet, click either here or on each function.
					
					<a href="http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element" target="_blank">element</a><br/>
					elementIdAttribute
					elementIdClick
					elementIdCssProperty
					elementIdDisplayed
					elementIdLocation
					elementIdSize
					elementIdText
					elementIdValue
					elements
					execute
					frame
					init
					screenshot
					session
					status
					submit
					title
					url
					value
					window
					windowHandles
					
				</section>
					
				<section class="chapter">
					<h2>about</h2>
					A set of protocol bindings for webdriver trough nodejs.
					It is written so its easy to add new protocol implementations and add helper commands so make testing easier. each command resides as one file inside the node module folder which makes it easy to extend.

					The two main reasons for this projects are: 

					1) Ease of use - Writing tests with webdriver should be very easy

					2) Easy to extend - Adding helper functions, or more complicated sets and combinations of existing commands, should also be very easy.
				</section>
				
			</div>
			<footer>

			</footer>
		</div> <!--! end of #container -->

	</body>
</html>
