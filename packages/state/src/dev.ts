import type { Container } from './container';
import { isServer } from 'solid-js/web';

export const $SB_DEV = import.meta.env.STATEBUILDER_DEV || false;

const containers: Container[] = [];
const statebuilder = {
  containers,
};
if ($SB_DEV) {
  if (!isServer && 'window' in globalThis) {
    (globalThis.window as any).statebuilder = statebuilder;
  }
}

export function __devRegisterContainer(container: Container) {
  containers.push(container);
  if ('window' in globalThis) {
    console.groupCollapsed(`[statebuilder] - Register container`);
    console.log(containers);
    console.groupEnd();
  }
}

export function __devDestroyContainer(container: Container) {
  containers.splice(containers.indexOf(container), 1);
  if ('window' in globalThis) {
    console.groupCollapsed(`[statebuilder] - Register container`);
    console.log(containers);
    console.groupEnd();
  }
}
