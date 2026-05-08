import GObject, { register } from "gnim/gobject";
import { startOnce } from "./startOnce";

// WeakMap keeps per-instance state entirely outside GObject's construction
// chain, avoiding the "must call super before using this" error that occurs
// when any field initialiser or constructor body touches `this` in a GObject
// subclass before GJS has finished building the native object.
const _GstartMap = new WeakMap<GServiceBase, () => Promise<void>>();

@register({ GTypeName: "ServiceBase" })
export class GServiceBase extends GObject.Object {
  // Subclasses store their singleton here.
  // We cannot put it on the base class because GObject
  // static fields don't inherit cleanly in GJS.
  // Each subclass must declare:
  //   private static _default: SubclassType | null = null;

  get start(): () => Promise<void> {
    let fn = _GstartMap.get(this);
    if (!fn) {
      fn = startOnce(() => this._boot());
      _GstartMap.set(this, fn);
    }
    return fn;
  }

  protected _boot(): Promise<void> {
    throw new Error(`[ServiceBase] ${this.constructor.name} must implement _boot()`);
  }
}

const _startMap = new WeakMap<ServiceBase, () => Promise<void>>()

export abstract class ServiceBase {
  // Now explicitly abstract - TypeScript handles the enforcement
  protected abstract _boot(): Promise<void>

  get start(): () => Promise<void> {
    let fn = _startMap.get(this)
    if (!fn) {
      fn = startOnce(() => this._boot())
      _startMap.set(this, fn)
    }
    return fn
  }
}
