import type { Container } from './container';
import { isServer } from 'solid-js/web';

// @ts-expect-error This type will not be exported
export const $SB_DEV = __STATEBUILDER_DEV__ || false;

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