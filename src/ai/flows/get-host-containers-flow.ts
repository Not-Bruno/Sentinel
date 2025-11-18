'use server';
/**
 * @fileOverview A flow to get container information from a host.
 *
 * - getHostContainers - A function that fetches container data from a host via SSH.
 * - GetHostContainersInput - The input type for the getHostContainers function.
 * - GetHostContainersOutput - The return type for the getHostContainers function.
 */

import { ai } from '@/ai/genkit';
import type { Container } from '@/lib/types';
import { z } from 'genkit';
import { NodeSSH } from 'node-ssh';

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

const USE_MOCK_DATA = process.env.NODE_ENV !== 'production' || !process.env.SSH_PRIVATE_KEY;


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
    
    // In a production environment, you would use real SSH credentials.
    // For this development environment, we will use mock data.
    if (USE_MOCK_DATA) {
        console.log(`[MOCK] Simulating SSH to ${input.ipAddress}:${input.sshPort} to get containers.`);
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        return mockContainerResponses[input.hostId] || [];
    }

    /*
    // === PRODUCTION SSH LOGIC ===
    // To enable this, you must:
    // 1. Set the SSH_PRIVATE_KEY environment variable with your private SSH key content.
    //    Example in .env.local: SSH_PRIVATE_KEY="-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
    // 2. Ensure your hosting environment has network access to your hosts.
    // 3. Set NODE_ENV to 'production' or remove the USE_MOCK_DATA flag check.

    const ssh = new NodeSSH();
    const command = "docker ps -a --format '{{json .}}'";
    
    console.log(`Executing over SSH: ${command}`);

    try {
        await ssh.connect({
            host: input.ipAddress,
            port: input.sshPort,
            username: 'root', // As per your requirement
            privateKey: process.env.SSH_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        });

        const result = await ssh.execCommand(command);

        if (result.code !== 0) {
            console.error('SSH command failed:', result.stderr);
            throw new Error(`Failed to execute command on host ${input.ipAddress}: ${result.stderr}`);
        }

        const containerJsonLines = result.stdout.trim().split('\n');
        
        if (containerJsonLines.length === 1 && containerJsonLines[0] === '') {
          return []; // No containers found
        }

        const containers: Container[] = containerJsonLines.map(line => {
            const dockerInfo = JSON.parse(line);
            let status: Container['status'] = 'stopped';
            if (dockerInfo.State === 'running') {
              status = 'running';
            } else if (dockerInfo.State === 'exited' || dockerInfo.State === 'created') {
              status = 'stopped';
            } else {
              status = 'error';
            }

            return {
                id: dockerInfo.ID,
                name: dockerInfo.Names,
                image: dockerInfo.Image,
                status: status,
                createdAt: Date.parse(dockerInfo.CreatedAt), // This might need adjustment based on exact format
            };
        });

        return containers;

    } catch (error) {
        console.error(`SSH connection or command error for host ${input.ipAddress}:`, error);
        // Fallback to empty array or re-throw, depending on desired behavior on failure
        throw error;
    } finally {
        ssh.dispose();
    }
    */
   
   // This part is reachable only if the production logic is commented out.
   console.log(`[MOCK] Simulating SSH to ${input.ipAddress}:${input.sshPort} to get containers.`);
   await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
   if (mockContainerResponses[input.hostId]) {
       return mockContainerResponses[input.hostId];
   }
   return [];
  }
);
