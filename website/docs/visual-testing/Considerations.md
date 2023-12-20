---
index: 1
id: considerations
title: Considerations
---

# Key Considerations for Optimal Use

Before diving into the powerful features of the `wdio-image-comparison-service`, it's crucial to understand some key considerations that ensure you get the most out of this tool. The following points are designed to guide you through best practices and common pitfalls, helping you achieve accurate and efficient visual testing results. These considerations are not just recommendations, but essential aspects to keep in mind for effectively utilizing the service in real-world scenarios.

# Important Considerations

## 1. Nature of Comparison

-   **Pixel-by-Pixel Basis:** The module performs a pixel-by-pixel comparison of images. While certain aspects can be adjusted (see Comparison Options), the core approach remains a basic pixel comparison.
-   **Impact of Browser Updates:** Be aware that updates to browsers, like Chrome, may affect font rendering, potentially necessitating an update to your baseline images.

## 2. Consistency in Platforms

-   **Comparing Identical Platforms:** Ensure screenshots are compared within the same platform. For instance, a screenshot from Chrome on a Mac should not be used to compare against one from Chrome on Ubuntu or Windows.
-   **Analogy:** To put it simply, compare _'Apples with Apples, not Apples with Androids'_.

## 3. Caution with Mismatch Percentage

-   **Risk of Accepting Mismatches:** Exercise caution when accepting a mismatch percentage. This is especially true for large screenshots, where accepting a mismatch might inadvertently overlook significant discrepancies, such as missing buttons or elements.

## 4. Mobile Screen Simulation

-   **Avoid Browser Resizing for Mobile Simulation:** Do not attempt to simulate mobile screen sizes by resizing desktop browsers and treating them as mobile browsers. Desktop browsers, even when resized, do not accurately replicate the rendering of actual mobile browsers.
-   **Authenticity in Comparison:** This tool aims to compare visuals as they would appear to an end-user. A resized desktop browser does not reflect the true experience on a mobile device.

## 5. Stance on Headless Browsers

-   **Not Recommended for Headless Browsers:** The use of this module with headless browsers is not advised. The rationale is that end-users do not interact with headless browsers, and therefore issues arising from such use will not be supported.
