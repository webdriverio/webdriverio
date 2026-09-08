import { z } from 'zod'

/** @deprecated superseded by {@link jsonSchemaToZodObject}; kept for type-compat. */
export type JsonSchemaProperty = Record<string, unknown>

/** @deprecated superseded by {@link jsonSchemaToZodObject}; kept for type-compat. */
export type JsonSchemaObject = Record<string, unknown>

/** True for zod schema instances (v3 `_def` / v4 `_zod`); the SDK accepts them as-is. */
export function isZodSchema(schema: unknown): boolean {
    return typeof schema === 'object' && schema !== null && ('_def' in schema || '_zod' in schema)
}

/** Converts a plain JSON schema into a zod object for MCP registration. */
export function jsonSchemaToZodObject(json: unknown): z.ZodType {
    try {
        return z.fromJSONSchema(json as never)
    } catch {
        return z.object({}).passthrough()
    }
}
