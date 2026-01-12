/**
 * XPath axes that cannot be mapped to predicate strings or class chains.
 *
 * These axes require traversing UP the tree (parent/ancestor),
 * SIDEWAYS (siblings), or by document order - none of which are
 * supported by predicate strings or class chains.
 */
export const UNMAPPABLE_XPATH_AXES = [
    { pattern: /ancestor::/i, name: 'ancestor axis' },
    { pattern: /ancestor-or-self::/i, name: 'ancestor-or-self axis' },
    { pattern: /following-sibling::/i, name: 'following-sibling axis' },
    { pattern: /preceding-sibling::/i, name: 'preceding-sibling axis' },
    { pattern: /following::/i, name: 'following axis' },
    { pattern: /preceding::/i, name: 'preceding axis' },
    { pattern: /parent::/i, name: 'parent axis' },
] as const

/**
 * XPath functions that cannot be mapped to predicate strings or class chains.
 */
export const UNMAPPABLE_XPATH_FUNCTIONS = [
    { pattern: /normalize-space\(/i, name: 'normalize-space() function' },
    { pattern: /position\(\)/i, name: 'position() function' },
    { pattern: /count\(/i, name: 'count() function' },
] as const

/**
 * Patterns that indicate a complex XPath requiring predicate/class chain conversion
 * (not suitable for simple accessibility ID conversion).
 */
export const COMPLEX_XPATH_PATTERNS = [
    /\s+or\s+/i,
    /\s+and\s+/i,
    /contains\(/i,
    /starts-with\(/i,
    /ends-with\(/i,
    /text\(\)/i,
    /substring\(/i,
    /\[.*\[/,
    /@\w+\s*[!=<>]+\s*["'][^"']+["']\s+or\s+@\w+\s*[!=<>]+\s*["'][^"']+["']/i,
    /@\w+\s*[!=<>]+\s*["'][^"']+["']\s+and\s+@\w+\s*[!=<>]+\s*["'][^"']+["']/i,
] as const

/**
 * Priority order of attributes for building unique selectors.
 * Meaningful attributes first, then boolean attributes.
 */
export const ATTRIBUTE_PRIORITY = ['name', 'label', 'value', 'enabled', 'visible', 'accessible', 'hittable'] as const

/**
 * Attributes that contain meaningful identifying information.
 */
export const MEANINGFUL_ATTRIBUTES = ['name', 'label', 'value'] as const

/**
 * Boolean attributes that may help with uniqueness but are less reliable.
 */
export const BOOLEAN_ATTRIBUTES = ['enabled', 'visible', 'accessible', 'hittable'] as const
