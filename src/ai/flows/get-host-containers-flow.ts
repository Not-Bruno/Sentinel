'use server';
/**
 * @fileOverview Dieser Flow ist dafür zuständig, Container-Informationen und Systemmetriken
 * von einem Host abzurufen.
 *
 * - getHostData: Eine Funktion, die Container- und System-Daten entweder über eine SSH-Verbindung
 *   oder direkt lokal abfragt.
 * - GetHostDataInput: Definiert, welche Informationen du der Funktion übergeben musst.
 * - GetHostDataOutput: Definiert, was du als Ergebnis zurückbekommst.
 */

import { ai } from '@/ai/genkit';
import type { Container } from '@/lib/types';
import { z } from 'genkit';
import { NodeSSH } from 'node-ssh';
import { exec } from 'child_process';

const GetHostDataInputSchema = z.object({
  hostId: z.string().describe('Die ID des Hosts.'),
  ipAddress: z.string().describe('Die IP-Adresse des Hosts.'),
  sshPort: z.number().describe('Der SSH-Port des Hosts.'),
});
export type GetHostDataInput = z.infer<typeof GetHostDataInputSchema>;

export interface GetHostDataOutput {
  containers: Container[];
  cpuUsage?: number;
  memoryUsage?: number;
  memoryUsedGb?: number;
  memoryTotalGb?: number;
  diskUsage?: number;
  diskUsedGb?: number;
  diskTotalGb?: number;
}

// Dies ist eine Wrapper-Funktion, die den eigentlichen Flow aufruft.
export async function getHostData(input: GetHostDataInput): Promise<GetHostDataOutput> {
  return getHostDataFlow(input);
}

const getHostDataFlow = ai.defineFlow(
  {
    name: 'getHostDataFlow',
    inputSchema: GetHostDataInputSchema,
    outputSchema: z.any(),
  },
  async (input): Promise<GetHostDataOutput> => {
    // Befehle zum Abrufen der Systemmetriken und Container-Infos
    // We use awk to get specific values. The output is space-separated.
    const commands = {
      containers: "docker ps -a --format '{{json .}}'",
      cpu: `top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}'`,
      // memory: Gibt zurück: total_kb used_kb
      memory: `free | awk 'NR==2{printf "%d %d", $2, $3 }'`,
      // disk: Gibt zurück: total_gb used_gb percentage%
      disk: `df -h / --output=size,used,pcent | awk 'NR==2{print $1, $2, $3}'`,
    };

    const executeCommand = (command: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Fehler bei lokaler Ausführung von "${command}":`, stderr);
            return resolve(''); 
          }
          resolve(stdout.trim());
        });
      });
    };

    const parseDfOutput = (output: string): { diskUsedGb?: number; diskTotalGb?: number; diskUsage?: number } => {
        if (!output) return {};
        // Example output: "458G 151G 34%"
        const parts = output.replace(/G/g, ' ').replace(/M/g, ' / 1024').replace(/K/g, ' / 1024 / 1024').replace(/%/g, '').split(/\s+/);
        if (parts.length < 3) return {};
        
        const totalGb = parseFloat(parts[0]);
        const usedGb = parseFloat(parts[1]);
        const usage = parseFloat(parts[2]);

        return {
            diskTotalGb: isNaN(totalGb) ? undefined : totalGb,
            diskUsedGb: isNaN(usedGb) ? undefined : usedGb,
            diskUsage: isNaN(usage) ? undefined : usage,
        };
    };

    const parseFreeOutput = (output: string): { memoryUsedGb?: number; memoryTotalGb?: number; memoryUsage?: number } => {
        if (!output) return {};
        // Example output: "16028592 5592348" (in KB)
        const parts = output.split(' ');
        if (parts.length < 2) return {};

        const totalKb = parseInt(parts[0], 10);
        const usedKb = parseInt(parts[1], 10);
        if (isNaN(totalKb) || isNaN(usedKb) || totalKb === 0) return {};

        const totalGb = parseFloat((totalKb / 1024 / 1024).toFixed(1));
        const usedGb = parseFloat((usedKb / 1024 / 1024).toFixed(1));
        const usage = parseFloat(((usedKb / totalKb) * 100).toFixed(0));

        return {
            memoryTotalGb: totalGb,
            memoryUsedGb: usedGb,
            memoryUsage: usage,
        };
    }

    const executeAndParse = async (executor: (cmd: string) => Promise<string>) => {
        const [containerOutput, cpuOutput, memoryOutput, diskOutput] = await Promise.all([
            executor(commands.containers),
            executor(commands.cpu),
            executor(commands.memory),
            executor(commands.disk),
        ]);

        const containers = containerOutput ? parseDockerPsJson(containerOutput) : [];
        const cpuUsage = cpuOutput ? parseFloat(cpuOutput) : undefined;
        const memoryData = parseFreeOutput(memoryOutput);
        const diskData = parseDfOutput(diskOutput);

        return {
            containers,
            cpuUsage,
            ...memoryData,
            ...diskData,
        };
    };


    // Sonderfall für den lokalen Host: Hier nutzen wir den Docker-Socket.
    if (input.ipAddress === '0.0.0.1') {
      console.log(`[LOKAL] Führe Befehle direkt über den Docker-Socket aus.`);
      return executeAndParse(executeCommand);
    }

    // Standard-Logik für Remote-Hosts über SSH
    if (!process.env.SSH_PRIVATE_KEY) {
      console.error('Umgebungsvariable SSH_PRIVATE_KEY ist nicht gesetzt. Für Remote-Hosts werden keine Daten zurückgegeben.');
      return { containers: [] };
    }

    const ssh = new NodeSSH();
    console.log(`[SSH] Führe Befehle über SSH auf ${input.ipAddress}:${input.sshPort} aus.`);

    try {
      await ssh.connect({
        host: input.ipAddress,
        port: input.sshPort,
        username: 'root', // Docker und Systembefehle erfordern oft root-Rechte
        privateKey: process.env.SSH_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
      
      const sshExecutor = async (command: string) => {
        const result = await ssh.execCommand(command);
        if (result.code !== 0) {
            console.error(`Fehler bei SSH-Ausführung von "${command}":`, result.stderr);
            return '';
        }
        return result.stdout.trim();
      };

      return await executeAndParse(sshExecutor);

    } catch (error) {
      console.error(`Fehler bei SSH-Verbindung oder Befehl für Host ${input.ipAddress}:`, error);
      throw error;
    } finally {
      if (ssh.isConnected()) {
        ssh.dispose();
      }
    }
  }
);

/**
 * Wandelt den JSON-Output des `docker ps`-Befehls in ein sauberes Array von Container-Objekten um.
 * @param stdout Die rohe Ausgabe des Befehls.
 * @returns Ein Array von Container-Objekten.
 */
function parseDockerPsJson(stdout: string): Container[] {
    const trimmedStdout = stdout.trim();
    if (!trimmedStdout) {
      return [];
    }
    const containerJsonLines = trimmedStdout.split('\n');
    
    const containers: Container[] = containerJsonLines.map(line => {
        try {
          const dockerInfo = JSON.parse(line);
          let status: Container['status'] = 'stopped';
          
          if (dockerInfo.State === 'running') {
            status = 'running';
          } else if (dockerInfo.State === 'exited' || dockerInfo.State === 'created') {
            status = 'stopped';
          } else {
            status = 'error';
          }
          
          // Robustere Datumsumwandlung
          const createdAtTimestamp = Date.parse(dockerInfo.CreatedAt.replace(" Z", "Z"));

          return {
              id: dockerInfo.ID,
              name: dockerInfo.Names,
              image: dockerInfo.Image,
              status: status,
              uptime: dockerInfo.Status,
              createdAt: !isNaN(createdAtTimestamp) ? createdAtTimestamp : Date.now(),
          };
        } catch (e) {
          console.error(`Konnte die Docker-JSON-Zeile nicht parsen: ${line}`, e);
          return null;
        }
    }).filter((c): c is Container => c !== null);

    return containers;
}
