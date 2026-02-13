import type { DepPrefix, DepRef, DepSubtree, OptRef } from "./types";

const asPrefix = (prefix: string): DepPrefix => ({ kind: "prefix", prefix });
const asSubtree = (node: Record<string, unknown>): DepSubtree => ({ kind: "subtree", node });

/**
 * Typed deps builder.
 *
 * Common:
 *   deps: [
 *     dep.root(r => r.osd.enable),
 *     dep.self(s => s.heartbeatPollUser),
 *     dep.opt(localOpt),
 *   ]
 *
 * Subtree/prefix semantics without strings:
 *   deps: [ dep.subtree.root(r => r.osd) ]
 */
export const dep = {
    /** Depend on a specific Opt under root. */
    root: <Root, Self, O extends OptRef>(select: (root: Root) => O): DepRef<Root, Self> => ({
        resolve: ({ root }) => select(root),
    }),

    /** Depend on a specific Opt under self. */
    self: <Root, Self, O extends OptRef>(select: (self: Self) => O): DepRef<Root, Self> => ({
        resolve: ({ self }) => select(self),
    }),

    /** Depend on an Opt you already have a reference to (closure/local variable). */
    opt: <Root, Self, O extends OptRef>(opt: O): DepRef<Root, Self> => ({
        resolve: () => opt,
    }),

    /** Escape hatch for dynamic ids/prefixes. Prefer dep.root/dep.self/dep.subtree.*. */
    prefix: <Root, Self>(prefix: string): DepRef<Root, Self> => ({
        resolve: () => asPrefix(prefix),
    }),

    /** Watch all Opts under a subtree object (static-schema equivalent of prefix watching). */
    subtree: {
        root: <Root, Self>(select: (root: Root) => Record<string, unknown>): DepRef<Root, Self> => ({
            resolve: ({ root }) => asSubtree(select(root)),
        }),
        self: <Root, Self>(select: (self: Self) => Record<string, unknown>): DepRef<Root, Self> => ({
            resolve: ({ self }) => asSubtree(select(self)),
        }),
        value: <Root, Self>(node: Record<string, unknown>): DepRef<Root, Self> => ({
            resolve: () => asSubtree(node),
        }),
    },
} as const;
