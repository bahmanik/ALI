import type { Accessor, Setter, State } from "gnim"

export const isAccessor = <T>(
  value: unknown
): value is Accessor<T> => {
  return (
    typeof value === "function" &&
    "peek" in value &&
    "subscribe" in value &&
    "as" in value
  )
}

export const isSetter = <T>(
  value: unknown
): value is Setter<T> => {
  return (
    typeof value === "function" &&
    !("peek" in value)
  )
}

export const isState = <T>(
  value: T | State<T>
): value is State<T> => {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isAccessor(value[0]) &&
    isSetter(value[1])
  )
}
