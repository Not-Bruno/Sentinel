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
  diskUsage?: number;
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
    const commands = {
      containers: "docker ps -a --format '{{json .}}'",
      cpu: `top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}'`,
      memory: `free | awk 'NR==2{printf "%.2f", $3*100/$2 }'`,
      disk: `df -h / | awk 'NR==2{print $5}' | sed 's/%//'`,
    };

    const executeCommand = (command: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Fehler bei lokaler Ausführung von "${command}":`, stderr);
            // Wir lehnen das Promise nicht ab, sondern geben einen leeren String zurück, damit die UI nicht abstürzt
            return resolve(''); 
          }
          resolve(stdout.trim());
        });
      });
    };

    // Sonderfall für den lokalen Host: Hier nutzen wir den Docker-Socket.
    if (input.ipAddress === '0.0.0.1') {
      console.log(`[LOKAL] Führe Befehle direkt über den Docker-Socket aus.`);
      const [containerOutput, cpuOutput, memoryOutput, diskOutput] = await Promise.all([
        executeCommand(commands.containers),
        executeCommand(commands.cpu),
        executeCommand(commands.memory),
        executeCommand(commands.disk),
      ]);
      
      const containers = containerOutput ? parseDockerPsJson(containerOutput) : [];
      
      return {
        containers,
        cpuUsage: cpuOutput ? parseFloat(cpuOutput) : undefined,
        memoryUsage: memoryOutput ? parseFloat(memoryOutput) : undefined,
        diskUsage: diskOutput ? parseFloat(diskOutput) : undefined,
      };
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
      
      const combinedCommand = `${commands.containers}; echo "---SPLIT---"; ${commands.cpu}; echo "---SPLIT---"; ${commands.memory}; echo "---SPLIT---"; ${commands.disk}`;
      const result = await ssh.execCommand(combinedCommand);

      if (result.code !== 0) {
        console.error('SSH-Befehl fehlgeschlagen:', result.stderr);
        throw new Error(`Fehler beim Ausführen des Befehls auf Host ${input.ipAddress}: ${result.stderr}`);
      }
      
      const [containerOutput, cpuOutput, memoryOutput, diskOutput] = result.stdout.split('---SPLIT---');

      return {
        containers: parseDockerPsJson(containerOutput || ''),
        cpuUsage: cpuOutput ? parseFloat(cpuOutput.trim()) : undefined,
        memoryUsage: memoryOutput ? parseFloat(memoryOutput.trim()) : undefined,
        diskUsage: diskOutput ? parseFloat(diskOutput.trim()) : undefined,
      };

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

          return {
              id: dockerInfo.ID,
              name: dockerInfo.Names,
              image: dockerInfo.Image,
              status: status,
              uptime: dockerInfo.Status,
              createdAt: Date.parse(dockerInfo.CreatedAt) || new Date(dockerInfo.CreatedAt * 1000).getTime() || Date.now(),
          };
        } catch (e) {
          console.error(`Konnte die Docker-JSON-Zeile nicht parsen: ${line}`, e);
          return null;
        }
    }).filter((c): c is Container => c !== null);

    return containers;
}
