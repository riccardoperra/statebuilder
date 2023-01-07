import { describe, expect, it } from 'vitest';
import { $EXTENSION, $NAME, create } from '../src/api';

describe('Api', () => {
  describe('create', () => {
    it('should define state with params', () => {
      const creatorFn = create('custom', () => {
        return {} as any;
      });

      const definition = creatorFn();

      expect(definition[$EXTENSION]).toEqual([]);
      expect(definition[$NAME]).toEqual('custom-1');
    });
  });
});
