import type { ACTIONS, OptionSpec, PositionalSpec } from './specs.js'

type Spec = (typeof ACTIONS)[number]

export type ActionName = Spec['name']

/**
 * actions an agent can run against a session, `local` ones run in the CLI process
 */
export type AgentActionName = Exclude<ActionName, Extract<Spec, { local: true }>['name']>

type CamelCase<S extends string> = S extends `${infer Head}-${infer Char}${infer Rest}`
    ? `${Head}${Uppercase<Char>}${CamelCase<Rest>}`
    : S

type PositionalsOf<S> = S extends { positionals: infer P extends readonly PositionalSpec[] } ? P[number] : never
type OptionsOf<S> = S extends { options: infer O extends Readonly<Record<string, OptionSpec>> } ? O : {}

type PositionalValue<P> = P extends { choices: infer C extends readonly string[] } ? C[number] : string

type OptionValue<O extends OptionSpec> =
    (O extends { choices: infer C extends readonly string[] }
        ? C[number]
        : O['type'] extends 'boolean' ? boolean : O['type'] extends 'number' ? number : string
    ) extends infer V ? O extends { array: true } ? V[] : V : never

type Simplify<T> = { [K in keyof T]: T[K] } & {}

type ArgsOfSpec<S> = Simplify<
    { [P in Extract<PositionalsOf<S>, { required: true }> as CamelCase<P['name']>]: PositionalValue<P> } &
    { [P in Exclude<PositionalsOf<S>, { required: true }> as CamelCase<P['name']>]?: PositionalValue<P> } &
    { [K in keyof OptionsOf<S> & string as CamelCase<K>]?: OptionValue<Extract<OptionsOf<S>[K], OptionSpec>> }
>

/**
 * arguments of an action, shaped like the CLI's `pickArgs` output: variadic
 * positionals are one string, kebab-case flags are camelCased
 */
export type ActionArgsOf<A extends ActionName> = ArgsOfSpec<Extract<Spec, { name: A }>>
