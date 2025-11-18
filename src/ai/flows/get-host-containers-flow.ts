'use server';
/**
 * @fileOverview A flow to get container information from a host.
 *
 * - getHostContainers - A function that fetches container data from a host via SSH or locally.
 * - GetHostContainersInput - The input type for the getHostContainers function.
 * - GetHostContainersOutput - The return type for the getHostContainers function.
 */

import { ai } from '@/ai/genkit';
import type { Container } from '@/lib/types';
import { z } from 'genkit';
import { NodeSSH } from 'node-ssh';
import { exec } from 'child_process';

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
    const command = "docker ps -a --format '{{json .}}'";

    // Special case for the local host via Docker socket
    if (input.ipAddress === '0.0.0.1') {
      console.log(`[LOCAL] Executing locally via Docker socket: ${command}`);
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('Local docker command failed:', stderr);
            // Check for a common error when the socket is not mounted
            if (stderr.includes('permission denied') || stderr.includes('Is the docker daemon running?')) {
               console.error('Error hint: Is /var/run/docker.sock correctly mounted into the container with the right permissions?');
               // Return empty array to prevent UI crash
               return resolve([]);
            }
            return reject(new Error(`Failed to execute local command: ${stderr}`));
          }
          const containers = parseDockerPsJson(stdout);
          resolve(containers);
        });
      });
    }

    // Existing SSH logic for remote hosts
    if (!process.env.SSH_PRIVATE_KEY) {
      console.error('SSH_PRIVATE_KEY environment variable is not set. Returning empty container list for remote host.');
      return [];
    }

    const ssh = new NodeSSH();
    console.log(`[SSH] Executing over SSH to ${input.ipAddress}:${input.sshPort}: ${command}`);

    try {
        await ssh.connect({
            host: input.ipAddress,
            port: input.sshPort,
            username: 'root',
            privateKey: process.env.SSH_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });

        const result = await ssh.execCommand(command);

        if (result.code !== 0) {
            console.error('SSH command failed:', result.stderr);
            throw new Error(`Failed to execute command on host ${input.ipAddress}: ${result.stderr}`);
        }

        return parseDockerPsJson(result.stdout);

    } catch (error) {
        console.error(`SSH connection or command error for host ${input.ipAddress}:`, error);
        throw error;
    } finally {
        if(ssh.isConnected()) {
          ssh.dispose();
        }
    }
  }
);

function parseDockerPsJson(stdout: string): Container[] {
    const containerJsonLines = stdout.trim().split('\n');
    
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
            createdAt: Date.parse(dockerInfo.CreatedAt) || new Date(dockerInfo.CreatedAt * 1000).getTime() || Date.now(),
        };
    });

    return containers;
}
