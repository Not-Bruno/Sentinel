import type { Host } from './types';

// This data is now only used for the initial paint, 
// then it's replaced by the data from the flow.
export const INITIAL_HOSTS: Host[] = [
  {
    id: 'host-1',
    name: 'Production Web Server',
    ipAddress: '192.168.1.101',
    sshPort: 22,
    status: 'online',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    containers: [],
  },
  {
    id: 'host-2',
    name: 'Database Server',
    ipAddress: '192.168.1.102',
    sshPort: 22,
    status: 'online',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
    containers: [],
  },
  {
    id: 'host-3',
    name: 'Monitoring & Staging',
    ipAddress: '192.168.1.103',
    sshPort: 2222,
    status: 'offline',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
    containers: [],
  },
];
