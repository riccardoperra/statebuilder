import { expect, it } from 'vitest';
import { $SB_DEV } from '../src';

it('enables dev mode when the compiler plugin sets `dev: true`', () => {
  expect($SB_DEV).toBe(true);
});
