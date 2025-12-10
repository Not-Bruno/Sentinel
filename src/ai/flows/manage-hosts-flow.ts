'use server';
/**
 * @fileOverview These flows manage the hosts in the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getConnection, initDB } from '@/lib/db';
import type { Host, DatabaseStatus } from '@/lib/types';
import { RowDataPacket } from 'mysql2';

// Initialize the database and create tables if they don't exist
initDB();

const hostSchema = z.object({
  id: z.string(),
  name: z.string(),
  ipAddress: z.string(),
  sshPort: z.number().optional().nullable(),
  status: z.enum(['online', 'offline']),
  createdAt: z.number(),
  containers: z.string(), // JSON string
  cpuUsage: z.number().optional().nullable(),
  memoryUsage: z.number().optional().nullable(),
  memoryUsedGb: z.number().optional().nullable(),
  memoryTotalGb: z.number().optional().nullable(),
  diskUsage: z.number().optional().nullable(),
  diskUsedGb: z.number().optional().nullable(),
  diskTotalGb: z.number().optional().nullable(),
  history: z.string(), // JSON string
});

function parseDbHost(dbHost: any): Host {
    return {
        ...dbHost,
        sshPort: dbHost.ssh_port,
        ipAddress: dbHost.ip_address,
        createdAt: Number(dbHost.created_at),
        cpuUsage: dbHost.cpu_usage,
        memoryUsage: dbHost.memory_usage,
        memoryUsedGb: dbHost.memory_used_gb,
        memoryTotalGb: dbHost.memory_total_gb,
        diskUsage: dbHost.disk_usage,
        diskUsedGb: dbHost.disk_used_gb,
        diskTotalGb: dbHost.disk_total_gb,
        containers: JSON.parse(dbHost.containers || '[]'),
        history: JSON.parse(dbHost.history || '[]'),
    };
}


const checkDbConnectionFlow = ai.defineFlow(
  {
    name: 'checkDbConnectionFlow',
    outputSchema: z.enum(['connected', 'disconnected', 'error']),
  },
  async (): Promise<DatabaseStatus> => {
    try {
      const conn = await getConnection();
      await conn.ping();
      conn.release();
      return 'connected';
    } catch (error) {
      console.error('Database connection check failed:', error);
      return 'error';
    }
  }
);


const getSavedHostsFlow = ai.defineFlow(
  {
    name: 'getSavedHostsFlow',
    outputSchema: z.array(z.any()),
  },
  async (): Promise<Host[]> => {
    const conn = await getConnection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>('SELECT * FROM hosts ORDER BY created_at DESC');
      return rows.map(parseDbHost);
    } catch (error) {
      console.error('Error fetching hosts from DB:', error);
      throw new Error('Could not read host data.');
    } finally {
        conn.release();
    }
  }
);

const saveHostFlow = ai.defineFlow(
  {
    name: 'saveHostFlow',
    inputSchema: z.any(),
  },
  async (host: Host): Promise<void> => {
    const conn = await getConnection();
    try {
      const query = `
        INSERT INTO hosts (id, name, ip_address, ssh_port, status, created_at, containers, history, cpu_usage, memory_usage, memory_used_gb, memory_total_gb, disk_usage, disk_used_gb, disk_total_gb)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        host.id,
        host.name,
        host.ipAddress,
        host.sshPort ?? 22,
        host.status,
        host.createdAt,
        JSON.stringify(host.containers || []),
        JSON.stringify(host.history || []),
        host.cpuUsage,
        host.memoryUsage,
        host.memoryUsedGb,
        host.memoryTotalGb,
        host.diskUsage,
        host.diskUsedGb,
        host.diskTotalGb
      ];
      await conn.query(query, values);
    } catch (error) {
      console.error('Error saving host to DB:', error);
      throw new Error('Could not save host data.');
    } finally {
        conn.release();
    }
  }
);

const updateHostFlow = ai.defineFlow({
    name: 'updateHostFlow',
    inputSchema: z.any(),
}, async(host: Host): Promise<void> => {
    const conn = await getConnection();
    try {
        const query = `
            UPDATE hosts
            SET name = ?, ip_address = ?, ssh_port = ?, status = ?, containers = ?, history = ?, cpu_usage = ?, memory_usage = ?, memory_used_gb = ?, memory_total_gb = ?, disk_usage = ?, disk_used_gb = ?, disk_total_gb = ?
            WHERE id = ?
        `;
        const values = [
            host.name,
            host.ipAddress,
            host.sshPort ?? 22,
            host.status,
            JSON.stringify(host.containers || []),
            JSON.stringify(host.history || []),
            host.cpuUsage,
            host.memoryUsage,
            host.memoryUsedGb,
            host.memoryTotalGb,
            host.diskUsage,
            host.diskUsedGb,
            host.diskTotalGb,
            host.id
        ];
        await conn.query(query, values);
    } catch (error) {
        console.error('Error updating host in DB:', error);
        throw new Error('Could not update host data.');
    } finally {
        conn.release();
    }
});

const deleteHostFlow = ai.defineFlow({
    name: 'deleteHostFlow',
    inputSchema: z.string(),
}, async(hostId: string): Promise<void> => {
    const conn = await getConnection();
    try {
        await conn.query('DELETE FROM hosts WHERE id = ?', [hostId]);
    } catch (error) {
        console.error('Error deleting host from DB:', error);
        throw new Error('Could not delete host data.');
    } finally {
        conn.release();
    }
});


// Wrapper functions
export async function getSavedHosts(): Promise<Host[]> {
    return getSavedHostsFlow();
}

export async function saveHost(host: Host): Promise<void> {
    return saveHostFlow(host);
}

export async function updateHost(host: Host): Promise<void> {
    return updateHostFlow(host);
}

export async function deleteHost(hostId: string): Promise<void> {
    return deleteHostFlow(hostId);
}

export async function checkDbConnection(): Promise<DatabaseStatus> {
    return checkDbConnectionFlow();
}
