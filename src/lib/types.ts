export type ContainerStatus = 'running' | 'stopped' | 'error';

export interface Container {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  createdAt: number; // Use timestamp for easier serialization
}

export type HostStatus = 'online' | 'offline';

export interface Host {
  id:string;
  name: string;
  ipAddress: string;
  sshPort?: number;
  status: HostStatus;
  createdAt: number; // Use timestamp for easier serialization
  containers: Container[];
}