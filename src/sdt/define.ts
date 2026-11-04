import type { FilterFieldDef, SortOption } from "./types"

/**
 * String keys of `T`. When `T` is `unknown` (default), falls back to any
 * string — making the model-type generic strictly opt-in.
 */
type KeysOf<T> = T extends object ? Extract<keyof T, string> : string

/**
 * Identity helpers that preserve literal types (ids, `type` discriminators)
 * in a stored variable — so downstream consumers like `views.builtinViews`
 * can narrow `fieldId` / `operator` / `value` / sort `fieldId` against them.
 *
 * The `const` type parameter modifier makes TypeScript infer the tuple
 * without the caller needing `as const` at each call site.
 *
 * Curried to work around a TypeScript limitation: when both `TWhere` and
 * the `const F` tuple are on the same signature, explicit `TWhere`
 * short-circuits the `const` literal inference. Calling
 * `defineFilterFields<TWhere>()([...])` lets TS preserve the tuple's
 * literal `id`/`type` values on the inner call.
 *
 * The optional second generic `TNode` constrains every field `id` to be a
 * key of the model type — so `id: "providderName"` (typo) becomes a
 * compile error. Omit `TNode` to allow arbitrary string ids.
 *
 * @example Without model constraint — ids are free strings
 *   const filterFields = defineFilterFields<AiModelWhereInput>()([
 *     { id: "status", type: "boolean", ... },
 *   ])
 *
 * @example With model constraint — ids must be keyof AiModel
 *   const filterFields = defineFilterFields<AiModelWhereInput, AiModel>()([
 *     { id: "status", type: "boolean", ... },         // ✓ keyof AiModel
 *     { id: "providderName", type: "select", ... },   // ✗ typo → compile error
 *   ])
 */
export function defineFilterFields<TWhere, TNode = unknown>(): <
	const F extends readonly FilterFieldDef<TWhere, KeysOf<TNode>>[],
>(
	fields: F,
) => F {
	return (fields) => fields
}

/**
 * Identity helper for `sortOptions` — preserves `fieldId` literal union.
 *
 * Curried (same reason as `defineFilterFields`) so the optional generic
 * `TSortField` can constrain each `fieldId` to a known union of
 * order-field enum values (e.g. the SDK's `AiModelOrderField`). Omit the
 * generic to allow arbitrary string ids.
 *
 * @example Without constraint
 *   const sortOptions = defineSortOptions()([
 *     { fieldId: "CREATED_AT", label: "Created date" },
 *   ])
 *
 * @example With constraint
 *   const sortOptions = defineSortOptions<"CREATED_AT" | "STATUS">()([
 *     { fieldId: "CREATED_AT", label: "Created date" },
 *     { fieldId: "FOO", label: "…" }, // ✗ compile error
 *   ])
 */
export function defineSortOptions<TSortField extends string = string>(): <
	const S extends readonly SortOption<TSortField>[],
>(
	options: S,
) => S {
	return (options) => options
}
