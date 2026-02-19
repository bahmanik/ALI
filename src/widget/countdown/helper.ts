import { Gtk } from 'ags/gtk4';

import type { CountdownStackTransition } from 'src/configuration/modules/countdown/type';


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
  };

  return STACK_TRANSITION[t];
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) {
    const ago = -ms;
    // Keep it short.
    if (ago < 60_000) return 'Reached';
    return `Reached ${formatDuration(ago)} ago`;
  }
  return formatDuration(ms);
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);

  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (mins || hours || days) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}
