import { Gtk } from 'ags/gtk4'

import type { CountdownStackTransition } from 'src/configuration/modules/countdown/type'

export function toGtkStackTransition(t: CountdownStackTransition): Gtk.StackTransitionType {
  const STACK_TRANSITION: Record<CountdownStackTransition, Gtk.StackTransitionType> = {
    NONE: Gtk.StackTransitionType.NONE,
    CROSSFADE: Gtk.StackTransitionType.CROSSFADE,
    SLIDE_RIGHT: Gtk.StackTransitionType.SLIDE_RIGHT,
    SLIDE_LEFT: Gtk.StackTransitionType.SLIDE_LEFT,
    SLIDE_UP: Gtk.StackTransitionType.SLIDE_UP,
    SLIDE_DOWN: Gtk.StackTransitionType.SLIDE_DOWN,
    SLIDE_LEFT_RIGHT: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
    SLIDE_UP_DOWN: Gtk.StackTransitionType.SLIDE_UP_DOWN,
    OVER_UP: Gtk.StackTransitionType.OVER_UP,
    OVER_DOWN: Gtk.StackTransitionType.OVER_DOWN,
    OVER_LEFT: Gtk.StackTransitionType.OVER_LEFT,
    OVER_RIGHT: Gtk.StackTransitionType.OVER_RIGHT,
    UNDER_UP: Gtk.StackTransitionType.UNDER_UP,
    UNDER_DOWN: Gtk.StackTransitionType.UNDER_DOWN,
    UNDER_LEFT: Gtk.StackTransitionType.UNDER_LEFT,
    UNDER_RIGHT: Gtk.StackTransitionType.UNDER_RIGHT,
    OVER_UP_DOWN: Gtk.StackTransitionType.OVER_UP_DOWN,
    OVER_DOWN_UP: Gtk.StackTransitionType.OVER_DOWN_UP,
    OVER_LEFT_RIGHT: Gtk.StackTransitionType.OVER_LEFT_RIGHT,
    OVER_RIGHT_LEFT: Gtk.StackTransitionType.OVER_RIGHT_LEFT,
    ROTATE_LEFT: Gtk.StackTransitionType.ROTATE_LEFT,
    ROTATE_RIGHT: Gtk.StackTransitionType.ROTATE_RIGHT,
    ROTATE_LEFT_RIGHT: Gtk.StackTransitionType.ROTATE_LEFT_RIGHT,
  }

  return STACK_TRANSITION[t]
}
