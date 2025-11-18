import type { Host } from './types';

export const INITIAL_HOSTS: Host[] = [
  {
    id: 'host-1',
    name: 'Production Web Server',
    ipAddress: '192.168.1.101',
    status: 'online',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    containers: [
      {
        id: 'container-1-1',
        name: 'nginx-proxy',
        image: 'nginx:latest',
        status: 'running',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
      },
      {
        id: 'container-1-2',
        name: 'app-frontend',
        image: 'node:18-alpine',
        status: 'running',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
      {
        id: 'container-1-3',
        name: 'app-backend',
        image: 'python:3.9-slim',
        status: 'error',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
       {
        id: 'container-1-4',
        name: 'another-service',
        image: 'generic/service:1.0',
        status: 'running',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
      },
    ],
  },
  {
    id: 'host-2',
    name: 'Database Server',
    ipAddress: '192.168.1.102',
    status: 'online',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
    containers: [
      {
        id: 'container-2-1',
        name: 'postgres-db',
        image: 'postgres:14',
        status: 'running',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      },
      {
        id: 'container-2-2',
        name: 'redis-cache',
        image: 'redis:alpine',
        status: 'stopped',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      },
    ],
  },
  {
    id: 'host-3',
    name: 'Monitoring & Staging',
    ipAddress: '192.168.1.103',
    status: 'offline',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
    containers: [],
  },
];
