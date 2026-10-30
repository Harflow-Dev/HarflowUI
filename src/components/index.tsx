import type { HostState } from '../presentation/index.js';
export function HostDiagnostic({ state }: { readonly state: HostState }) {
  return (
    <section aria-label="Development diagnostic">
      <h1>Harflow client scaffold</h1>
      <p>Development diagnostic; engine operations are unsupported.</p>
      <p role="status">
        {state.status === 'ready'
          ? `${state.information.application} ${state.information.version}`
          : state.status === 'error'
            ? state.message
            : state.status}
      </p>
    </section>
  );
}
