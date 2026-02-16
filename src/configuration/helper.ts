import type { OptionsRoot, OptFactory } from "src/lib/options";

type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type Merge<T extends readonly object[]> = UnionToIntersection<T[number]>;

/**
 * stem:
 * - defines a module factory with inferred Self
 * - avoids TS7022 because modules are functions, not self-typed object literals
 */
function stem<Self>(factory: (opt: OptFactory<OptionsRoot, any>) => Self) {
  // infer Self from return type (object literal), not from the opt parameter
  return factory as unknown as (opt: OptFactory<OptionsRoot, Self>) => Self;
}

/**
 * twig:
 * - rebind injected OptFactory to a child Self type
 * - runtime identical (same function), type-only cast via unknown
 */
function twig<Self, Child>(opt: OptFactory<OptionsRoot, Self>): OptFactory<OptionsRoot, Child> {
  return opt as unknown as OptFactory<OptionsRoot, Child>;
}

/** Merge object fragments with a precise intersection type. */
function graft<const Parts extends readonly object[]>(...parts: Parts): Merge<Parts> {
  return Object.assign({}, ...parts) as unknown as Merge<Parts>;
}

export { stem, twig, graft };
