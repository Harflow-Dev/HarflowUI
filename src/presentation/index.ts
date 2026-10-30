import type { HostInformationReader } from '../application/index.js';
import type { HostInformation } from '../model/index.js';
export type HostState =
  | Readonly<{ status: 'idle' | 'loading' }>
  | Readonly<{ status: 'ready'; information: HostInformation }>
  | Readonly<{ status: 'error'; message: string }>;

export class HostPresenter {
  private state: HostState = Object.freeze({ status: 'idle' });
  private generation = 0;
  private disposed = false;
  private readonly listeners = new Set<() => void>();
  constructor(private readonly read: HostInformationReader) {}
  getSnapshot = (): HostState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(state: HostState): void {
    this.state = Object.freeze(state);
    for (const listener of this.listeners) listener();
  }
  private isCurrent(generation: number): boolean {
    return !this.disposed && generation === this.generation;
  }
  async refresh(): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.publish({ status: 'loading' });
    try {
      const information = await this.read.execute();
      if (this.isCurrent(generation))
        this.publish({
          status: 'ready',
          information: Object.freeze({ ...information }),
        });
    } catch (error: unknown) {
      if (this.isCurrent(generation))
        this.publish({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Host information unavailable',
        });
    }
  }
  dispose(): void {
    this.disposed = true;
    this.generation++;
    this.listeners.clear();
  }
}
