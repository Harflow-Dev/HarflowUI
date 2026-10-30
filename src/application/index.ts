import type { HostInformation } from '../model/index.js';
export interface HostInformationPort {
  read(): Promise<HostInformation>;
}
export interface HostInformationReader {
  execute(): Promise<HostInformation>;
}
export class ReadHostInformation implements HostInformationReader {
  constructor(private readonly host: HostInformationPort) {}
  execute(): Promise<HostInformation> {
    return this.host.read();
  }
}
