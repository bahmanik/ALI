/**
 * Ambiently-augmented root options tree type.
 *
 * Each option module augments this interface via:
 *   declare module "src/lib/options/root" { interface OptionsRoot { ... } }
 *
 * This gives every module access to the full Root type without importing the
 * built options object (so no cycles), while staying fully type-safe.
 */
export interface OptionsRoot { }
