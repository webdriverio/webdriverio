import { z } from 'zod'

/**
 * langchain v1 `tool()` exposes `schema` as a plain JSON-schema object
 * (MCP-adapter tools) or a zod schema (langchain `tool()`), while the MCP
 * SDK wants a zod schema/raw shape. This converter covers the subset our
 * harness tools produce (object with string/boolean/number/enum/array-string
 * properties + required list).
 */

export interface JsonSchemaProperty {
    type?: string
    enum?: string[]
    items?: JsonSchemaProperty
    description?: string
}

export interface JsonSchemaObject {
    type?: string
    properties?: Record<string, JsonSchemaProperty>
    required?: string[]
}

/** True for zod schema instances (v3 `_def` / v4 `_zod`); the SDK accepts them as-is. */
export function isZodSchema(schema: unknown): boolean {
    return typeof schema === 'object' && schema !== null && ('_def' in schema || '_zod' in schema)
}

function propertyToZod(prop: JsonSchemaProperty | undefined): z.ZodType {
    switch (prop?.type) {
    case 'string':
        return prop.enum ? z.enum(prop.enum as [string, ...string[]]) : z.string()
    case 'boolean':
        return z.boolean()
    case 'number':
    case 'integer':
        return z.number()
    case 'array':
        return z.array(propertyToZod(prop.items))
    default:
        return z.any()
    }
}

/** Converts the tool's JSON schema into a zod raw shape for MCP registration. */
export function jsonSchemaToZodRawShape(json: JsonSchemaObject | undefined): z.ZodRawShape {
    const shape: Record<string, z.ZodType> = {}
    for (const [key, prop] of Object.entries(json?.properties ?? {})) {
        const zodType = propertyToZod(prop)
        shape[key] = json?.required?.includes(key) ? zodType : zodType.optional()
    }
    return shape as z.ZodRawShape
}
