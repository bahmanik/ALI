import type { OptionsRoot, OptFactory } from "src/lib/options";

type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type Merge<T extends readonly object[]> = UnionToIntersection<T[number]>;

/**
 * stem:
 * - Explicit module contracts: callers should pass <Self>
 * - The injected opt() is typed as OptFactory<OptionsRoot, Self>
 *   so dep/derive see the same strongly-typed Self.
 */
type Exact<Shape, Actual extends Shape> = Actual & Record<Exclude<keyof Actual, keyof Shape>, never>;
type ExactFn<Self> = <Actual extends Self>(value: Exact<Self, Actual>) => Actual;

function stem<Self>(
  factory: (opt: OptFactory<OptionsRoot, Self>, exact: ExactFn<Self>) => Self,
): (opt: OptFactory<OptionsRoot, Self>) => Self {
  const exact: ExactFn<Self> = (value) => value;
  return (opt) => factory(opt, exact);
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
