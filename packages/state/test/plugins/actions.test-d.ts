import { describe, expectTypeOf, it } from 'vitest';
import { Container, defineSignal, defineStore } from '../../src';
import { withActions } from '../../src/plugins/actions';

const FrameStore = defineStore(() => ({ padding: 64, visible: true })).extend(
  withActions((store) => ({
    setPadding(padding: number) {
      store.set((state) => {
        state.padding = padding;
      });
    },
    toggleVisibility() {
      store.set((state) => {
        state.visible = !state.visible;
      });
    },
    rename(name: string, force?: boolean) {
      return name.length > 0 || !!force;
    },
  })),
);

const frame = Container.create().get(FrameStore);

describe('withActions', () => {
  it('types the store given to the factory as extended so far', () => {
    defineSignal(() => 1)
      .extend((store) => ({ double: () => store() * 2 }))
      .extend(
        withActions((store, context) => {
          expectTypeOf(store.double).toEqualTypeOf<() => number>();
          context.onSet((value) => expectTypeOf(value).toEqualTypeOf<number>());
          return {};
        }),
      );
  });

  it('keeps the action signatures', () => {
    expectTypeOf(frame.actions.setPadding).parameters.toEqualTypeOf<
      [padding: number]
    >();
    expectTypeOf(frame.actions.rename).returns.toEqualTypeOf<boolean>();
  });

  it('gives silent the same parameters and return type', () => {
    expectTypeOf(frame.actions.setPadding.silent).parameters.toEqualTypeOf<
      [padding: number]
    >();
    expectTypeOf(frame.actions.rename.silent).parameters.toEqualTypeOf<
      [name: string, force?: boolean]
    >();
    expectTypeOf(frame.actions.rename.silent).returns.toEqualTypeOf<boolean>();
  });

  it('infers args from the action name', () => {
    frame.onAction('setPadding', (event) => {
      expectTypeOf(event.name).toEqualTypeOf<'setPadding'>();
      expectTypeOf(event.args).toEqualTypeOf<[padding: number]>();
    });
    frame.onAction('toggleVisibility', (event) => {
      expectTypeOf(event.args).toEqualTypeOf<[]>();
    });
  });

  it('gives a union of events for a list of names', () => {
    frame.onAction(['setPadding', 'rename'], (event) => {
      expectTypeOf(event).toEqualTypeOf<
        | { readonly name: 'setPadding'; readonly args: [padding: number] }
        | {
            readonly name: 'rename';
            readonly args: [name: string, force?: boolean];
          }
      >();
      if (event.name === 'rename') {
        expectTypeOf(event.args[0]).toEqualTypeOf<string>();
      }
    });
  });

  it('gives the union of every action without a name', () => {
    frame.onAction((event) => {
      expectTypeOf(event.name).toEqualTypeOf<
        'setPadding' | 'toggleVisibility' | 'rename'
      >();
    });
  });

  it('rejects an unknown action name', () => {
    // @ts-expect-error unknown action name
    frame.onAction('setMargin', () => {});
    // @ts-expect-error unknown action name in a list
    frame.onAction(['setPadding', 'setMargin'], () => {});
    // @ts-expect-error unknown phase
    frame.onAction('setPadding', () => {}, { phase: 'during' });
  });

  it('merges the actions of two withActions', () => {
    const Counter = defineSignal(() => 0)
      .extend(
        withActions((store) => ({
          add(amount: number) {
            store.set((count) => count + amount);
          },
        })),
      )
      .extend(
        withActions((store) => ({
          addTwice(amount: number) {
            store.actions.add(amount);
            store.actions.add(amount);
          },
        })),
      );
    const counter = Container.create().get(Counter);

    expectTypeOf(counter.actions.add).parameters.toEqualTypeOf<
      [amount: number]
    >();
    expectTypeOf(counter.actions.addTwice).parameters.toEqualTypeOf<
      [amount: number]
    >();
    counter.onAction('add', ({ args }) =>
      expectTypeOf(args).toEqualTypeOf<[amount: number]>(),
    );
    counter.onAction('addTwice', () => {});
  });
});

describe('this inside an action', () => {
  it('is the map of bound actions', () => {
    defineSignal(() => 0).extend(
      withActions((store) => ({
        reset() {
          store.set(0);
        },
        resetQuietly() {
          this.reset.silent();
          expectTypeOf(this.reset).parameters.toEqualTypeOf<[]>();
        },
      })),
    );
  });
});
