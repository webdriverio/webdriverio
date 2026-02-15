/**
 * Platform-specific element tag constants for mobile automation
 */

export const ANDROID_INTERACTABLE_TAGS = [
    // Input elements
    'android.widget.EditText',
    'android.widget.AutoCompleteTextView',
    'android.widget.MultiAutoCompleteTextView',
    'android.widget.SearchView',

    // Button-like elements
    'android.widget.Button',
    'android.widget.ImageButton',
    'android.widget.ToggleButton',
    'android.widget.CompoundButton',
    'android.widget.RadioButton',
    'android.widget.CheckBox',
    'android.widget.Switch',
    'android.widget.FloatingActionButton',
    'com.google.android.material.button.MaterialButton',
    'com.google.android.material.floatingactionbutton.FloatingActionButton',

    // Text elements (often tappable)
    'android.widget.TextView',
    'android.widget.CheckedTextView',

    // Image elements (often tappable)
    'android.widget.ImageView',
    'android.widget.QuickContactBadge',

    // Selection elements
    'android.widget.Spinner',
    'android.widget.SeekBar',
    'android.widget.RatingBar',
    'android.widget.ProgressBar',
    'android.widget.DatePicker',
    'android.widget.TimePicker',
    'android.widget.NumberPicker',

    // List/grid items
    'android.widget.AdapterView',
]

export const ANDROID_LAYOUT_CONTAINERS = [
    // Core ViewGroup classes
    'android.view.ViewGroup',
    'android.view.View',
    'android.widget.FrameLayout',
    'android.widget.LinearLayout',
    'android.widget.RelativeLayout',
    'android.widget.GridLayout',
    'android.widget.TableLayout',
    'android.widget.TableRow',
    'android.widget.AbsoluteLayout',

    // AndroidX layout classes
    'androidx.constraintlayout.widget.ConstraintLayout',
    'androidx.coordinatorlayout.widget.CoordinatorLayout',
    'androidx.appcompat.widget.LinearLayoutCompat',
    'androidx.cardview.widget.CardView',
    'androidx.appcompat.widget.ContentFrameLayout',
    'androidx.appcompat.widget.FitWindowsFrameLayout',

    // Scrolling containers
    'android.widget.ScrollView',
    'android.widget.HorizontalScrollView',
    'android.widget.NestedScrollView',
    'androidx.core.widget.NestedScrollView',
    'androidx.recyclerview.widget.RecyclerView',
    'android.widget.ListView',
    'android.widget.GridView',
    'android.widget.AbsListView',

    // App chrome / system elements
    'android.widget.ActionBarContainer',
    'android.widget.ActionBarOverlayLayout',
    'android.view.ViewStub',
    'androidx.appcompat.widget.ActionBarContainer',
    'androidx.appcompat.widget.ActionBarContextView',
    'androidx.appcompat.widget.ActionBarOverlayLayout',

    // Decor views
    'com.android.internal.policy.DecorView',
    'android.widget.DecorView',
]

export const IOS_INTERACTABLE_TAGS = [
    // Input elements
    'XCUIElementTypeTextField',
    'XCUIElementTypeSecureTextField',
    'XCUIElementTypeTextView',
    'XCUIElementTypeSearchField',

    // Button-like elements
    'XCUIElementTypeButton',
    'XCUIElementTypeLink',

    // Text elements (often tappable)
    'XCUIElementTypeStaticText',

    // Image elements
    'XCUIElementTypeImage',
    'XCUIElementTypeIcon',

    // Selection elements
    'XCUIElementTypeSwitch',
    'XCUIElementTypeSlider',
    'XCUIElementTypeStepper',
    'XCUIElementTypeSegmentedControl',
    'XCUIElementTypePicker',
    'XCUIElementTypePickerWheel',
    'XCUIElementTypeDatePicker',
    'XCUIElementTypePageIndicator',

    // Table/list items
    'XCUIElementTypeCell',
    'XCUIElementTypeMenuItem',
    'XCUIElementTypeMenuBarItem',

    // Toggle elements
    'XCUIElementTypeCheckBox',
    'XCUIElementTypeRadioButton',
    'XCUIElementTypeToggle',

    // Other interactive
    'XCUIElementTypeKey',
    'XCUIElementTypeKeyboard',
    'XCUIElementTypeAlert',
    'XCUIElementTypeSheet',
]

export const IOS_LAYOUT_CONTAINERS = [
    // Generic containers
    'XCUIElementTypeOther',
    'XCUIElementTypeGroup',
    'XCUIElementTypeLayoutItem',

    // Scroll containers
    'XCUIElementTypeScrollView',
    'XCUIElementTypeTable',
    'XCUIElementTypeCollectionView',
    'XCUIElementTypeScrollBar',

    // Navigation chrome
    'XCUIElementTypeNavigationBar',
    'XCUIElementTypeTabBar',
    'XCUIElementTypeToolbar',
    'XCUIElementTypeStatusBar',
    'XCUIElementTypeMenuBar',

    // Windows and views
    'XCUIElementTypeWindow',
    'XCUIElementTypeSheet',
    'XCUIElementTypeDrawer',
    'XCUIElementTypeDialog',
    'XCUIElementTypePopover',
    'XCUIElementTypePopUpButton',

    // Outline elements
    'XCUIElementTypeOutline',
    'XCUIElementTypeOutlineRow',
    'XCUIElementTypeBrowser',
    'XCUIElementTypeSplitGroup',
    'XCUIElementTypeSplitter',

    // Application root
    'XCUIElementTypeApplication',
]
