'use server';
/**
 * @fileOverview Diese Flows verwalten die persistente Liste deiner überwachten Hosts.
 *
 * - getSavedHosts: Liest die Liste der Hosts aus einer JSON-Datei.
 * - saveHosts: Schreibt die aktuelle Liste der Hosts in die JSON-Datei.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { promises as fs } from 'fs';
import path from 'path';
import type { Host } from '@/lib/types';

// Der Pfad zur Datei, in der wir die Host-Liste speichern.
const HOSTS_FILE_PATH = path.resolve(process.cwd(), 'data', 'hosts.json');

/**
 * Stellt sicher, dass das `data`-Verzeichnis existiert.
 * Ist für den Fall gedacht, dass etwas schiefgeht.
 * Normalerweise wird das Verzeichnis schon im Dockerfile erstellt.
 */
async function ensureDataDirectory() {
  try {
    // Wir prüfen nur den Zugriff, da das Verzeichnis bereits im Dockerfile erstellt werden sollte.
    await fs.access(path.dirname(HOSTS_FILE_PATH));
  } catch (error) {
    // Falls es dennoch fehlschlägt, versuchen wir, es zu erstellen.
    try {
      await fs.mkdir(path.dirname(HOSTS_FILE_PATH), { recursive: true });
    } catch (mkdirError) {
        console.error('Konnte das data-Verzeichnis nicht erstellen:', mkdirError);
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
      // Prüfen, ob die Datei existiert.
      await fs.access(HOSTS_FILE_PATH);
      const fileContent = await fs.readFile(HOSTS_FILE_PATH, 'utf-8');
      
      // Wenn die Datei leer ist, geben wir ein leeres Array zurück.
      if (fileContent.trim() === '') {
        return [];
      }
      return JSON.parse(fileContent) as Host[];
    } catch (error) {
      // Wenn die Datei nicht existiert, erstellen wir sie mit einem leeren Array.
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('hosts.json nicht gefunden. Initialisiere sie mit einem leeren Array.');
        await fs.writeFile(HOSTS_FILE_PATH, JSON.stringify([], null, 2));
        return [];
      }
      console.error('Fehler beim Lesen von hosts.json:', error);
      throw new Error('Konnte die Host-Daten nicht lesen.');
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
      const data = JSON.stringify(hosts, null, 2); // Mit Einrückung für bessere Lesbarkeit
      await fs.writeFile(HOSTS_FILE_PATH, data, 'utf-8');
    } catch (error) {
      console.error('Fehler beim Speichern von hosts.json:', error);
      throw new Error('Konnte die Host-Daten nicht speichern.');
    }
  }
);

// Wrapper-Funktionen, die du in deiner Anwendung aufrufst.
export async function getSavedHosts(): Promise<Host[]> {
    return getSavedHostsFlow();
}

export async function saveHosts(hosts: Host[]): Promise<void> {
    return saveHostsFlow(hosts);
}
