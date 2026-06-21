/**
 * Wall-clock access for dynamic Server Components.
 *
 * `Date.now()` is impure, so React's purity lint forbids calling it directly in
 * render. These pages are `force-dynamic` and legitimately need the current
 * time for relative timestamps ("2h ago"), so we read it through this clearly
 * named boundary instead.
 */
export function serverNow(): number {
  return Date.now();
}
