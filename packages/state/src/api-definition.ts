import {
  ApiDefinitionCreator,
  ApiDefinitionInternalCreator,
  GenericStoreApi,
  Plugin,
  PluginContext,
} from '~/types';
import { $CREATOR, $PLUGIN } from '~/api';

/**
 * @internal
 */
export class ApiDefinition<T extends GenericStoreApi, E extends {}>
  implements ApiDefinitionCreator<T, E>
{
  readonly [$CREATOR]: ApiDefinitionInternalCreator<T, E>;
  #customPluginId: number = 0;
  readonly #id: number = 0;
  readonly #plugins: Array<Plugin<any, any>> = [];

  constructor(name: string, id: number, factory: () => T) {
    this[$CREATOR] = { name, plugins: this.#plugins, factory };
    this.#id = id;
  }

  extend<TExtendedSignal extends {} | void>(
    createPlugin: (ctx: T & E, context: PluginContext<T>) => TExtendedSignal,
  ): ApiDefinitionCreator<T, TExtendedSignal & Omit<E, keyof TExtendedSignal>> {
    if (
      typeof createPlugin === 'function' &&
      !createPlugin.hasOwnProperty($PLUGIN)
    ) {
      this.#plugins.push({
        name: `custom-${++this.#customPluginId}`,
        apply: createPlugin,
      });
    } else {
      this.#plugins.push(createPlugin);
    }

    return this as unknown as ApiDefinitionCreator<
      T,
      TExtendedSignal & Omit<E, keyof TExtendedSignal>
    >;
  }
}
