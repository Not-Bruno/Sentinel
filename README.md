# Sentinel - Real-time simple Docker Container Monitoring

Unterstüzt durch KI

![Sentinel Dashboard]()

Sentinel ist eine moderne, webbasierte Anwendung, mit der du den Status von Docker-Containern auf verschiedenen Servern in Echtzeit überwachen kannst. Egal, ob die Container auf deinem lokalen Rechner oder auf Remote-Servern laufen – Sentinel gibt dir den perfekten Überblick. Die Anwendung wurde mit Next.js und Tailwind CSS entwickelt und ist für einen kinderleichten Betrieb im eigenen Docker-Container optimiert.

## Was Sentinel dir bietet

- **Echtzeit-Überwachung:** Du siehst live, ob deine Docker-Container laufen, gestoppt sind oder einen Fehler haben.
- **Multi-Host-Fähigkeit:** Überwache Container auf deinem lokalen Rechner und zusätzlich auf beliebig vielen Remote-Servern über SSH.
- **Automatische Host-Erkennung:** Sentinel überwacht standardmäßig den Server, auf dem es selbst läuft – ganz ohne zusätzliche Konfiguration.
- **Persistente Konfiguration:** Deine Liste von überwachten Servern wird dauerhaft gespeichert, sodass sie nach einem Neustart nicht verloren geht.
- **Modernes UI:** Eine saubere, reaktionsschnelle und anpassbare Benutzeroberfläche mit Dark Mode.
- **Einfache Bereitstellung:** Mit einer einzigen `docker-compose.yml`-Datei ist Sentinel blitzschnell einsatzbereit.

## Technologie-Stack

- **Frontend:** Next.js (React Framework)
- **Styling:** Tailwind CSS & shadcn/ui
- **Sprache:** TypeScript
- **Backend-Kommunikation:** Genkit (für die Logik hinter den SSH-Verbindungen und lokalen Befehlen)
- **Containerisierung:** Docker & Docker Compose

## So startest du Sentinel

Um Sentinel zu nutzen, brauchst du nur Docker und Docker Compose auf deinem System.

1.  **Repository klonen (falls du es noch nicht hast):**
    ```bash
    git clone <repository-url>
    cd <repository-ordner>
    ```

2.  **Anwendung bauen und starten:**
    Führe den folgenden Befehl im Hauptverzeichnis deines Projekts aus:
    ```bash
    docker-compose up --build -d
    ```
    Dieser Befehl baut das Docker-Image für Sentinel und startet den Container im Hintergrund (`-d`).

3.  **Anwendung öffnen:**
    Öffne deinen Webbrowser und gehe zu `http://localhost:3000`. Du solltest sofort das Sentinel-Dashboard sehen, das bereits die Container deines lokalen Rechners anzeigt.

## Konfiguration

### Dein lokaler Host
Standardmäßig liest Sentinel die Docker-Informationen deines Host-Systems über den Docker-Socket (`/var/run/docker.sock`). Das wird in der `docker-compose.yml` durch das sogenannte "Mounten" des Sockets ermöglicht:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

Dadurch ist für die Überwachung deines lokalen Systems keine weitere Konfiguration nötig. Einfach starten und loslegen!

### Remote-Hosts (über SSH)

Möchtest du zusätzliche Server überwachen? Dann musst du Sentinel den Zugriff über einen privaten SSH-Schlüssel geben.

1.  **SSH-Schlüssel vorbereiten:**
    Du benötigst einen privaten SSH-Schlüssel, der berechtigt ist, sich auf den Zielservern anzumelden (in der Regel als `root`-Benutzer, da Docker oft Root-Rechte erfordert).

2.  **Umgebungsvariable `SSH_PRIVATE_KEY` setzen:**
    Füge deinen privaten Schlüssel als Umgebungsvariable in die `docker-compose.yml`-Datei ein. **Wichtig:** Der Schlüssel muss als **einzeiliger String** formatiert sein, bei dem alle Zeilenumbrüche durch `\n` ersetzt werden.

    **Beispiel:**
    So sieht dein Originalschlüssel aus (`my_key`):
    ```
    -----BEGIN OPENSSH PRIVATE KEY-----
    abcde...
    fghij...
    -----END OPENSSH PRIVATE KEY-----
    ```

    Und so formatierst du ihn für die `docker-compose.yml`:
    ```yaml
    environment:
      - SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\nabcde...\nfghij...\n-----END OPENSSH PRIVATE KEY-----
    ```

    Füge diesen formatierten Schlüssel in den `sentinel`-Service deiner `docker-compose.yml` ein:
    ```yaml
    services:
      sentinel:
        # ... andere Konfigurationen
        environment:
          - NODE_ENV=production
          - SSH_PRIVATE_KEY=DEIN_FORMATIERTER_SCHLUESSEL
    ```

3.  **Container neu starten:**
    Nachdem du die `docker-compose.yml` geändert hast, starte den Container neu, damit die Änderungen übernommen werden:
    ```bash
    docker-compose up --build -d
    ```

4.  **Host im UI hinzufügen:**
    Klicke im Sentinel-Dashboard auf "Add Host" und gib den Namen, die IP-Adresse und den SSH-Port des Remote-Servers ein.

### Persistente Speicherung

Die Liste der Hosts, die du hinzufügst, wird in der Datei `/app/data/hosts.json` innerhalb des Containers gespeichert. Damit diese Liste auch dann erhalten bleibt, wenn du den Container neu erstellst, verwendet die `docker-compose.yml` ein sogenanntes "named Volume" (`sentinel-data`):

```yaml
volumes:
  sentinel-data:
    driver: local
```

Das stellt sicher, dass deine Host-Liste sicher aufbewahrt wird.

## Projektstruktur

```
.
├── data/
│   └── hosts.json        # Hier wird deine Liste der überwachten Hosts gespeichert
├── src/
│   ├── app/              # Next.js App Router, Seiten und Layouts
│   ├── components/       # Wiederverwendbare React-Komponenten (UI-Elemente)
│   ├── ai/               # Genkit-Flows für die Server-Logik (SSH, Dateizugriff)
│   └── lib/              # Hilfsfunktionen, Typdefinitionen etc.
├── Dockerfile            # Definiert, wie das Docker-Image für Sentinel gebaut wird
├── docker-compose.yml    # Definiert den Sentinel-Service und das Daten-Volume
└── next.config.ts        # Konfigurationsdatei für Next.js
```
