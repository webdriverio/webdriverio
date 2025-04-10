---
id: cli-wizard
title: CLI Wizard
---

You can validate which text can be found in an image without running a test by using the OCR CLI Wizard. The only thing that are needed are:

- you have installed the `@wdio/ocr-service` as a dependency, see [Getting Started](./getting-started)
- an image that you want to process

Then run the following command to start the wizard

```sh
npx ocr-service
```

This will start a wizard that will guide you through the steps to select an image and use a haystack plus advanced mode. The following questions are asked

## How would you like to specify the file?

The following options can be selected

- Use a "file explorer"
- Type the file path manually

### Use a "file explorer"

The CLI wizard provides an option to use a "file explorer" to search for files on your system. It starts from the folder you call the command. After selecting an image (use your arrow keys and the ENTER key) you will proceed to the next question

### Type the file path manually

This is a direct path to a file somewhere on your local machine

### Would you like to use a haystack?

Here you have the option to select an area that needs to be processed. This can speed up the process or reduce/narrow down the amount of text the OCR engine might find. You need to provide `x`, `y`, `width`, `height` data based on the following questions:

- Enter the x coordinate:
- Enter the y coordinate:
- Enter the width:
- Enter the height:

## Do you want to use the advanced mode?

Advanced mode will hold extra features like:

- setting the contrast
- more to follow in the future

## Demo

Here's a demo

<video controls width="100%">
  <source src="/img/ocr/ocr-service-cli.mp4" />
</video>
