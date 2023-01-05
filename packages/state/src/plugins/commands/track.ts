import { Accessor } from 'solid-js';

export function createTrackObserver(): [
  track: Accessor<boolean>,
  untrackCallback: (cb: () => void, async?: boolean) => void,
] {
  let track = true;
  return [
    () => track,
    (cb: () => void, async = true) => {
      track = false;
      cb();
      const schedule = async
        ? queueMicrotask
        : (cb: () => void) => cb();

      schedule(() => (track = true));
    },
  ];
}
