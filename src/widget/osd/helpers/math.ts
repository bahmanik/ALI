import { Accessor } from "gnim";

export function boolPeek(acc: Accessor): boolean {
  try {
    return Boolean(acc?.peek?.());
  } catch {
    try {
      return Boolean(acc?.peek?.());
    } catch {
      return Boolean(acc);
    }
  }
}
