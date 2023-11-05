import {
  ExtractStore,
  GenericStoreApi,
  HookConsumerFunction,
  Plugin,
  PluginContext,
  PluginHooks,
  StoreApiDefinition,
} from '~/types';
import { Container } from '~/container';

export class ResolvedPluginContext implements PluginContext {
  readonly initSubscriptions = new Set<HookConsumerFunction>();
  readonly destroySubscriptions = new Set<HookConsumerFunction>();
  readonly metadata: Map<string, unknown> = new Map<string, unknown>();

  hooks: PluginHooks<GenericStoreApi> = {
    onInit: (callback) => this.initSubscriptions.add(callback),
    onDestroy: (callback) => this.destroySubscriptions.add(callback),
  };

  constructor(
    private readonly container: Container | undefined,
    public readonly plugins: Plugin<any, any>[],
  ) {}

  inject<TStoreDefinition extends StoreApiDefinition<any, any>>(
    storeDefinition: TStoreDefinition,
  ): ExtractStore<TStoreDefinition> {
    if (!this.container) {
      throw new Error('[statebuilder] No container set in current context.');
    }
    return this.container.get(storeDefinition);
  }
}
