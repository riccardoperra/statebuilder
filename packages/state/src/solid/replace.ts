function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assign(target: any, key: string | number, value: unknown): void {
  const current = target[key];
  const sameShape = Array.isArray(value)
    ? Array.isArray(current)
    : isPlainObject(value) && isPlainObject(current);
  if (sameShape) replaceState(current, value);
  else target[key] = value;
}

/**
 * Makes the draft equal to `next`, writing only what differs. Objects and
 * arrays that exist on both sides are kept and updated in place, so the store
 * keeps their identity.
 */
export function replaceState(draft: any, next: any): void {
  if (Array.isArray(next)) {
    for (let index = 0; index < next.length; index++) {
      assign(draft, index, next[index]);
    }
    if (draft.length !== next.length) draft.length = next.length;
    return;
  }
  for (const key of Object.keys(draft)) {
    if (!(key in next)) delete draft[key];
  }
  for (const key of Object.keys(next)) assign(draft, key, next[key]);
}
