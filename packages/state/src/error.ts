export class StateBuilderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(`[statebuilder] ${message}`, options);
  }
}
