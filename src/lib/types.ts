/**
 * Definiert die möglichen Status-Typen für einen Container.
 * 'running': Der Container läuft normal.
 * 'stopped': Der Container wurde manuell oder planmäßig beendet.
 * 'error':   Der Container wurde unerwartet beendet oder hat einen Fehler.
 */
export type ContainerStatus = 'running' | 'stopped' | 'error';

/**
 * Definiert die Struktur eines einzelnen Container-Objekts.
 */
export interface Container {
  id: string;          // Eindeutige ID des Containers.
  name: string;        // Der Name des Containers.
  image: string;       // Das Image, aus dem der Container erstellt wurde.
  status: ContainerStatus; // Der aktuelle Laufzeitstatus des Containers.
  createdAt: number;   // Zeitstempel der Erstellung (als Unix-Timestamp in Millisekunden).
}

/**
 * Definiert die möglichen Status-Typen für einen Host.
 * 'online':  Der Host ist erreichbar.
 * 'offline': Der Host ist nicht erreichbar.
 */
export type HostStatus = 'online' | 'offline';

/**
 * Definiert die Struktur eines Host-Objekts, der überwacht wird.
 */
export interface Host {
  id:string;              // Eindeutige ID des Hosts.
  name: string;            // Ein benutzerfreundlicher Name für den Host.
  ipAddress: string;       // Die IP-Adresse des Hosts.
  sshPort?: number;        // Der SSH-Port des Hosts (optional, Standard ist 22).
  status: HostStatus;      // Der aktuelle Erreichbarkeitsstatus des Hosts.
  createdAt: number;       // Zeitstempel der Erstellung (als Unix-Timestamp in Millisekunden).
  containers: Container[]; // Eine Liste der auf diesem Host laufenden Container.
}
