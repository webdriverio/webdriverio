---
id: selectors
title: Selectors
---

The WebdriverIO MCP server supports multiple selector strategies for locating elements on web pages and mobile apps.

:::info

For comprehensive selector documentation including all WebdriverIO selector strategies, see the main [Selectors](/docs/selectors) guide. This page focuses on selectors commonly used with the MCP server.

:::

## Web Selectors

For browser automation, the MCP server supports all standard WebdriverIO selectors. The most commonly used include:

| Selector | Example | Description |
|----------|---------|-------------|
| CSS | `#login-button`, `.submit-btn` | Standard CSS selectors |
| XPath | `//button[@id='submit']` | XPath expressions |
| Text | `button=Submit`, `a*=Click` | WebdriverIO text selectors |
| ARIA | `aria/Submit Button` | Accessibility name selectors |
| Test ID | `[data-testid="submit"]` | Recommended for testing |

For detailed examples and best practices, see the [Selectors](/docs/selectors) documentation.

---

## Mobile Selectors

Mobile selectors work with both iOS and Android platforms through Appium.

### Accessibility ID (Recommended)

Accessibility IDs are the **most reliable cross-platform selector**. They work on both iOS and Android and are stable across app updates.

```
# Syntax
~accessibilityId

# Examples
~loginButton
~submitForm
~usernameField
```

:::tip Best Practice
Always prefer accessibility IDs when available. They provide:
- Cross-platform compatibility (iOS + Android)
- Stability across UI changes
- Better test maintainability
- Improved accessibility of your app
:::

### Android Selectors

#### UiAutomator

UiAutomator selectors are powerful and fast for Android.

```
# By Text
android=new UiSelector().text("Login")

# By Partial Text
android=new UiSelector().textContains("Log")

# By Resource ID
android=new UiSelector().resourceId("com.example:id/login_button")

# By Class Name
android=new UiSelector().className("android.widget.Button")

# By Description (Accessibility)
android=new UiSelector().description("Login button")

# Combined Conditions
android=new UiSelector().className("android.widget.Button").text("Login")

# Scrollable Container
android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("Item"))
```

#### Resource ID

Resource IDs provide stable element identification on Android.

```
# Full Resource ID
id=com.example.app:id/login_button

# Partial ID (app package inferred)
id=login_button
```

#### XPath (Android)

XPath works on Android but is slower than UiAutomator.

```
# By Class and Text
//android.widget.Button[@text='Login']

# By Resource ID
//android.widget.EditText[@resource-id='com.example:id/username']

# By Content Description
//android.widget.ImageButton[@content-desc='Menu']

# Hierarchical
//android.widget.LinearLayout/android.widget.Button[1]
```

### iOS Selectors

#### Predicate String

iOS Predicate Strings are fast and powerful for iOS automation.

```
# By Label
-ios predicate string:label == "Login"

# By Partial Label
-ios predicate string:label CONTAINS "Log"

# By Name
-ios predicate string:name == "loginButton"

# By Type
-ios predicate string:type == "XCUIElementTypeButton"

# By Value
-ios predicate string:value == "ON"

# Combined Conditions
-ios predicate string:type == "XCUIElementTypeButton" AND label == "Login"

# Visibility
-ios predicate string:label == "Login" AND visible == 1

# Case Insensitive
-ios predicate string:label ==[c] "login"
```

**Predicate Operators:**

| Operator | Description |
|----------|-------------|
| `==` | Equals |
| `!=` | Not equals |
| `CONTAINS` | Contains substring |
| `BEGINSWITH` | Starts with |
| `ENDSWITH` | Ends with |
| `LIKE` | Wildcard match |
| `MATCHES` | Regex match |
| `AND` | Logical AND |
| `OR` | Logical OR |

#### Class Chain

iOS Class Chains provide hierarchical element location with good performance.

```
# Direct Child
-ios class chain:**/XCUIElementTypeButton[`label == "Login"`]

# Any Descendant
-ios class chain:**/XCUIElementTypeButton

# By Index
-ios class chain:**/XCUIElementTypeCell[3]

# Combined with Predicate
-ios class chain:**/XCUIElementTypeButton[`name == "submit" AND visible == 1`]

# Hierarchical
-ios class chain:**/XCUIElementTypeTable/XCUIElementTypeCell[`label == "Settings"`]

# Last Element
-ios class chain:**/XCUIElementTypeButton[-1]
```

#### XPath (iOS)

XPath works on iOS but is slower than predicate strings.

```
# By Type and Label
//XCUIElementTypeButton[@label='Login']

# By Name
//XCUIElementTypeTextField[@name='username']

# By Value
//XCUIElementTypeSwitch[@value='1']

# Hierarchical
//XCUIElementTypeTable/XCUIElementTypeCell[1]
```

---

## Cross-Platform Selector Strategy

When writing tests that need to work on both iOS and Android, use this priority order:

### 1. Accessibility ID (Best)

```
# Works on both platforms
~loginButton
```

### 2. Platform-Specific with Conditional Logic

When accessibility IDs aren't available, use platform-specific selectors:

**Android:**
```
android=new UiSelector().text("Login")
```

**iOS:**
```
-ios predicate string:label == "Login"
```

### 3. XPath (Last Resort)

XPath works on both platforms but with different element types:

**Android:**
```
//android.widget.Button[@text='Login']
```

**iOS:**
```
//XCUIElementTypeButton[@label='Login']
```

---

## Element Types Reference

### Android Element Types

| Type | Description |
|------|-------------|
| `android.widget.Button` | Button |
| `android.widget.EditText` | Text input |
| `android.widget.TextView` | Text label |
| `android.widget.ImageView` | Image |
| `android.widget.ImageButton` | Image button |
| `android.widget.CheckBox` | Checkbox |
| `android.widget.RadioButton` | Radio button |
| `android.widget.Switch` | Toggle switch |
| `android.widget.Spinner` | Dropdown |
| `android.widget.ListView` | List view |
| `android.widget.RecyclerView` | Recycler view |
| `android.widget.ScrollView` | Scroll container |

### iOS Element Types

| Type | Description |
|------|-------------|
| `XCUIElementTypeButton` | Button |
| `XCUIElementTypeTextField` | Text input |
| `XCUIElementTypeSecureTextField` | Password input |
| `XCUIElementTypeStaticText` | Text label |
| `XCUIElementTypeImage` | Image |
| `XCUIElementTypeSwitch` | Toggle switch |
| `XCUIElementTypeSlider` | Slider |
| `XCUIElementTypePicker` | Picker wheel |
| `XCUIElementTypeTable` | Table view |
| `XCUIElementTypeCell` | Table cell |
| `XCUIElementTypeCollectionView` | Collection view |
| `XCUIElementTypeScrollView` | Scroll view |

---

## Best Practices

### Do

- **Use accessibility IDs** for stable, cross-platform selectors
- **Add data-testid attributes** to web elements for testing
- **Use resource IDs** on Android when accessibility IDs aren't available
- **Prefer predicate strings** over XPath on iOS
- **Keep selectors simple** and specific

### Don't

- **Avoid long XPath expressions** - they're slow and fragile
- **Don't rely on indices** for dynamic lists
- **Avoid text-based selectors** for localized apps
- **Don't use absolute XPath** (starting from root)

### Examples of Good vs Bad Selectors

```
# Good - Stable accessibility ID
~loginButton

# Bad - Fragile XPath with indices
//div[3]/form/button[2]

# Good - Specific CSS with test ID
[data-testid="submit-button"]

# Bad - Class that might change
.btn-primary-lg-v2

# Good - UiAutomator with resource ID
android=new UiSelector().resourceId("com.app:id/submit")

# Bad - Text that might be localized
android=new UiSelector().text("Submit")
```

---

## Debugging Selectors

### Web (Chrome DevTools)

1. Open Chrome DevTools (F12)
2. Use the Elements panel to inspect elements
3. Right-click an element → Copy → Copy selector
4. Test selectors in Console: `document.querySelector('your-selector')`

### Mobile (Appium Inspector)

1. Start Appium Inspector
2. Connect to your running session
3. Click on elements to see all available attributes
4. Use the "Search for element" feature to test selectors

### Using `get_visible_elements`

The MCP server's `get_visible_elements` tool returns multiple selector strategies for each element:

```
Ask Claude: "Get all visible elements on the screen"
```

This returns elements with pre-generated selectors you can use directly.

#### Advanced Options

For more control over element discovery:

```
# Get only images and visual elements
Get visible elements with elementType "visual"

# Get elements with their coordinates for layout debugging
Get visible elements with includeBounds enabled

# Get the next 20 elements (pagination)
Get visible elements with limit 20 and offset 20

# Include layout containers for debugging
Get visible elements with includeContainers enabled
```

The tool returns a paginated response:
```json
{
  "total": 42,
  "showing": 20,
  "hasMore": true,
  "elements": [...]
}
```

### Using `get_accessibility` (Browser Only)

For browser automation, the `get_accessibility` tool provides semantic information about page elements:

```
# Get all named accessibility nodes
Get accessibility tree

# Filter to only buttons and links
Get accessibility tree filtered to button and link roles

# Get next page of results
Get accessibility tree with limit 50 and offset 50
```

This is useful when `get_visible_elements` doesn't return expected elements, as it queries the browser's native accessibility API.
