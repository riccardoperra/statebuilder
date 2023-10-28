import {
  createRoot,
  getOwner,
  onCleanup,
  type Owner,
  runWithOwner,
} from 'solid-js';

type Disposable<T> = (dispoe: () => void) => T;

function createSubRoot<T>(
  fn: Disposable<T>,
  owner: typeof Owner = getOwner(),
): T {
  return createRoot((dispose) => {
    owner && runWithOwner(owner, onCleanup.bind(void 0, dispose));
    return fn(dispose);
  }, owner!);
}

export function runInSubRoot<T>(fn: Disposable<T>, owner?: typeof Owner): T {
  let error: unknown;
  const result = createSubRoot((dispose) => {
    try {
      return fn(dispose);
    } catch (e) {
      error = e;
      dispose();
      throw e;
    }
  }, owner);
  if (error) {
    throw error;
  }
  return result;
}
