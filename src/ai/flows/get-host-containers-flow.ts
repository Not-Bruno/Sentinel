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
    if (!process.env.SSH_PRIVATE_KEY) {
      console.error('SSH_PRIVATE_KEY environment variable is not set.');
      throw new Error('SSH private key is not configured. Cannot connect to hosts.');
    }

    const ssh = new NodeSSH();
    const command = "docker ps -a --format '{{json .}}'";
    
    console.log(`[PROD] Executing over SSH to ${input.ipAddress}:${input.sshPort}: ${command}`);

    try {
        await ssh.connect({
            host: input.ipAddress,
            port: input.sshPort,
            username: 'root', // As per your requirement
            privateKey: process.env.SSH_PRIVATE_KEY.replace(/\\n/g, '\n'),
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
                // The CreatedAt field from Docker is often a unix timestamp or a specific string format.
                // We attempt to parse it, but this might need adjustment based on exact Docker API output.
                createdAt: Date.parse(dockerInfo.CreatedAt) || new Date(dockerInfo.CreatedAt * 1000).getTime() || Date.now(),
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
  }
);
