'use server';
/**
 * @fileOverview Dieser Flow ist dafür zuständig, Container-Informationen von einem Host abzurufen.
 *
 * - getHostContainers: Eine Funktion, die Container-Daten entweder über eine SSH-Verbindung
 *   oder direkt lokal abfragt.
 * - GetHostContainersInput: Definiert, welche Informationen du der Funktion übergeben musst.
 * - GetHostContainersOutput: Definiert, was du als Ergebnis zurückbekommst.
 */

import { ai } from '@/ai/genkit';
import type { Container } from '@/lib/types';
import { z } from 'genkit';
import { NodeSSH } from 'node-ssh';
import { exec } from 'child_process';

const GetHostContainersInputSchema = z.object({
  hostId: z.string().describe('Die ID des Hosts.'),
  ipAddress: z.string().describe('Die IP-Adresse des Hosts.'),
  sshPort: z.number().describe('Der SSH-Port des Hosts.'),
});
export type GetHostContainersInput = z.infer<typeof GetHostContainersInputSchema>;

export type GetHostContainersOutput = Container[];

// Dies ist eine Wrapper-Funktion, die den eigentlichen Flow aufruft.
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

    // Sonderfall für den lokalen Host: Hier nutzen wir den Docker-Socket.
    // Wir erkennen den lokalen Host an der speziellen IP-Adresse '0.0.0.1'.
    if (input.ipAddress === '0.0.0.1') {
      console.log(`[LOKAL] Führe Befehl direkt über den Docker-Socket aus: ${command}`);
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('Lokaler Docker-Befehl fehlgeschlagen:', stderr);
            // Häufiger Fehler: Socket ist nicht gemountet oder Berechtigungen fehlen.
            if (stderr.includes('permission denied') || stderr.includes('Is the docker daemon running?')) {
               console.error('Fehlerhinweis: Ist /var/run/docker.sock korrekt in den Container gemountet und hat die richtigen Berechtigungen?');
               // Wir geben ein leeres Array zurück, damit die UI nicht abstürzt.
               return resolve([]);
            }
            return reject(new Error(`Konnte lokalen Befehl nicht ausführen: ${stderr}`));
          }
          const containers = parseDockerPsJson(stdout);
          resolve(containers);
        });
      });
    }

    // Standard-Logik für Remote-Hosts über SSH
    if (!process.env.SSH_PRIVATE_KEY) {
      console.error('Umgebungsvariable SSH_PRIVATE_KEY ist nicht gesetzt. Für Remote-Hosts wird eine leere Container-Liste zurückgegeben.');
      return [];
    }

    const ssh = new NodeSSH();
    console.log(`[SSH] Führe Befehl über SSH auf ${input.ipAddress}:${input.sshPort} aus: ${command}`);

    try {
        await ssh.connect({
            host: input.ipAddress,
            port: input.sshPort,
            username: 'root', // Docker erfordert oft root-Rechte
            privateKey: process.env.SSH_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });

        const result = await ssh.execCommand(command);

        if (result.code !== 0) {
            console.error('SSH-Befehl fehlgeschlagen:', result.stderr);
            throw new Error(`Fehler beim Ausführen des Befehls auf Host ${input.ipAddress}: ${result.stderr}`);
        }

        return parseDockerPsJson(result.stdout);

    } catch (error) {
        console.error(`Fehler bei SSH-Verbindung oder Befehl für Host ${input.ipAddress}:`, error);
        throw error;
    } finally {
        if(ssh.isConnected()) {
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
    // Jede Zeile ist ein JSON-Objekt für einen Container.
    const containerJsonLines = stdout.trim().split('\n');
    
    // Wenn die Ausgabe leer ist, gibt es keine Container.
    if (containerJsonLines.length === 1 && containerJsonLines[0] === '') {
      return [];
    }

    const containers: Container[] = containerJsonLines.map(line => {
        const dockerInfo = JSON.parse(line);
        let status: Container['status'] = 'stopped';
        
        // Wir interpretieren den Docker-Status und weisen unseren eigenen Status zu.
        if (dockerInfo.State === 'running') {
          status = 'running';
        } else if (dockerInfo.State === 'exited' || dockerInfo.State === 'created') {
          status = 'stopped'; // Gewollt gestoppt
        } else {
          status = 'error'; // Alle anderen Zustände (restarting, dead, etc.) gelten als Fehler.
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
