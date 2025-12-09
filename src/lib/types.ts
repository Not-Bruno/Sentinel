/**
 * Definiert die möglichen Status-Typen, die ein Container haben kann.
 * 'running': Der Container läuft wie erwartet.
 * 'stopped': Der Container wurde absichtlich gestoppt.
 * 'error':   Der Container wurde unerwartet beendet oder hat einen Fehler.
 */
export type ContainerStatus = 'running' | 'stopped' | 'error';

/**
 * Beschreibt die Struktur eines einzelnen Container-Objekts.
 * Hier legst du fest, welche Informationen du über einen Container speichern möchtest.
 */
export interface Container {
  id: string;          // Eindeutige ID des Containers, von Docker vergeben.
  name: string;        // Der Name, den du dem Container gegeben hast.
  image: string;       // Das Docker-Image, aus dem der Container erstellt wurde.
  status: ContainerStatus; // Der aktuelle Zustand des Containers.
  createdAt: number;   // Der Zeitstempel, wann der Container erstellt wurde (in Millisekunden).
}

/**
 * Definiert die möglichen Zustände für einen Host.
 * 'online':  Der Host ist erreichbar und antwortet.
 * 'offline': Der Host ist nicht erreichbar.
 */
export type HostStatus = 'online' | 'offline';

/**
 * Beschreibt die Struktur eines Host-Objekts, das du überwachst.
 * Das kann dein lokaler Rechner oder ein Remote-Server sein.
 */
export interface Host {
  id:string;              // Eine eindeutige ID, die du für den Host vergibst.
  name: string;            // Ein verständlicher Name für den Host (z.B. "Mein Webserver").
  ipAddress: string;       // Die IP-Adresse des Hosts.
  sshPort?: number;        // Der SSH-Port, falls er vom Standard-Port 22 abweicht.
  status: HostStatus;      // Der aktuelle Online-Status des Hosts.
  createdAt: number;       // Der Zeitstempel, wann du den Host hinzugefügt hast (in Millisekunden).
  containers: Container[]; // Eine Liste der Docker-Container, die auf diesem Host laufen.
  cpuUsage?: number;       // CPU-Auslastung in Prozent.
  memoryUsage?: number;    // Arbeitsspeicher-Auslastung in Prozent.
  diskUsage?: number;      // Festplatten-Auslastung in Prozent.
}
