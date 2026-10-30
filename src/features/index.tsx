import { useEffect, useState } from 'react';
import {
  ReadHostInformation,
  type HostInformationPort,
} from '../application/index.js';
import { HostPresenter, type HostState } from '../presentation/index.js';
import { HostDiagnostic } from '../components/index.js';
export function HostDiagnosticFeature({
  host,
}: {
  readonly host: HostInformationPort;
}) {
  const [state, setState] = useState<HostState>({ status: 'idle' });
  useEffect(() => {
    const presenter = new HostPresenter(new ReadHostInformation(host));
    const unsubscribe = presenter.subscribe(() => {
      setState(presenter.getSnapshot());
    });
    void presenter.refresh();
    return () => {
      unsubscribe();
      presenter.dispose();
    };
  }, [host]);
  return <HostDiagnostic state={state} />;
}
