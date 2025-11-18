'use server';
/**
 * @fileOverview A flow to get container information from a host.
 *
 * - getHostContainers - A function that simulates fetching container data from a host via SSH.
 * - GetHostContainersInput - The input type for the getHostContainers function.
 * - GetHostContainersOutput - The return type for the getHostContainers function.
 */

import { ai } from '@/ai/genkit';
import type { Container } from '@/lib/types';
import { z } from 'genkit';

const GetHostContainersInputSchema = z.object({
  hostId: z.string().describe('The ID of the host.'),
  ipAddress: z.string().describe('The IP address of the host.'),
  sshPort: z.number().describe('The SSH port of the host.'),
});
export type GetHostContainersInput = z.infer<typeof GetHostContainersInputSchema>;

export type GetHostContainersOutput = Container[];


const mockContainerResponses: Record<string, Container[]> = {
    'host-1': [
      { id: 'container-1-1', name: 'nginx-proxy', image: 'nginx:latest', status: 'running', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
      { id: 'container-1-2', name: 'app-frontend', image: 'node:18-alpine', status: 'running', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
      { id: 'container-1-3', name: 'app-backend', image: 'python:3.9-slim', status: 'error', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { id: 'container-1-4', name: 'another-service', image: 'generic/service:1.0', status: 'running', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1 },
    ],
    'host-2': [
       { id: 'container-2-1', name: 'postgres-db', image: 'postgres:14', status: 'running', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30 },
       { id: 'container-2-2', name: 'redis-cache', image: 'redis:alpine', status: 'stopped', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10 },
    ],
    'host-3': [],
};

// This is a wrapper function that calls the flow.
export async function getHostContainers(input: GetHostContainersInput): Promise<GetHostContainersOutput> {
  return getHostContainersFlow(input);
}


const getHostContainersFlow = ai.defineFlow(
  {
    name: 'getHostContainersFlow',
    inputSchema: GetHostContainersInputSchema,
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    console.log(`Simulating SSH to ${input.ipAddress}:${input.sshPort} to get containers.`);
    
    // In a real scenario, you would use a library like 'node-ssh' or 'execa'
    // to run 'ssh -i /root/.ssh/ID_DOCKER -p ${input.sshPort} root@${input.ipAddress} "docker ps -a --format '{{json .}}'"'
    // For security reasons, we will not execute shell commands. Instead, we return mock data.
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simulate different responses for different hosts, or a default/new host response.
    if (mockContainerResponses[input.hostId]) {
        return mockContainerResponses[input.hostId];
    }
    
    // Default response for a new host
    return [
        { id: `new-${Date.now()}`, name: 'new-container', image: 'ubuntu:latest', status: 'running', createdAt: Date.now() }
    ];
  }
);
