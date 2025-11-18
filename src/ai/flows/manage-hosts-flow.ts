'use server';
/**
 * @fileOverview Flows to manage the persistent list of hosts.
 *
 * - getSavedHosts - Reads the list of hosts from a JSON file.
 * - saveHosts - Writes the list of hosts to a JSON file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { promises as fs } from 'fs';
import path from 'path';
import type { Host } from '@/lib/types';

const HOSTS_FILE_PATH = path.resolve(process.cwd(), 'data', 'hosts.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
  try {
    // The directory is now created in the Dockerfile, so we just check access.
    await fs.access(path.dirname(HOSTS_FILE_PATH));
  } catch (error) {
    // If it still fails, we try to create it, but this shouldn't be the primary path.
    try {
      await fs.mkdir(path.dirname(HOSTS_FILE_PATH), { recursive: true });
    } catch (mkdirError) {
        console.error('Failed to create data directory:', mkdirError);
    }
  }
}

const getSavedHostsFlow = ai.defineFlow(
  {
    name: 'getSavedHostsFlow',
    outputSchema: z.array(z.any()),
  },
  async (): Promise<Host[]> => {
    await ensureDataDirectory();
    try {
      await fs.access(HOSTS_FILE_PATH);
      const fileContent = await fs.readFile(HOSTS_FILE_PATH, 'utf-8');
      // Handle empty file case
      if (fileContent.trim() === '') {
        return [];
      }
      return JSON.parse(fileContent) as Host[];
    } catch (error) {
      // If the file doesn't exist, create it and return an empty array.
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('hosts.json not found, initializing with an empty array.');
        await fs.writeFile(HOSTS_FILE_PATH, JSON.stringify([], null, 2));
        return [];
      }
      console.error('Failed to read hosts.json:', error);
      throw new Error('Could not read host data.');
    }
  }
);

const saveHostsFlow = ai.defineFlow(
  {
    name: 'saveHostsFlow',
    inputSchema: z.array(z.any()),
  },
  async (hosts: Host[]): Promise<void> => {
    await ensureDataDirectory();
    try {
      const data = JSON.stringify(hosts, null, 2);
      await fs.writeFile(HOSTS_FILE_PATH, data, 'utf-8');
    } catch (error) {
      console.error('Failed to save hosts.json:', error);
      throw new Error('Could not save host data.');
    }
  }
);

export async function getSavedHosts(): Promise<Host[]> {
    return getSavedHostsFlow();
}

export async function saveHosts(hosts: Host[]): Promise<void> {
    return saveHostsFlow(hosts);
}
