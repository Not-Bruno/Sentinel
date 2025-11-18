# Sentinel - Real-time Docker Container Monitoring

![Sentinel Dashboard](https://i.imgur.com/your-screenshot-url.png) <!-- Ersetzen Sie dies durch einen Screenshot Ihres Dashboards -->

Sentinel ist eine moderne, webbasierte Monitoring-Anwendung, die es Ihnen ermöglicht, den Status von Docker-Containern auf verschiedenen Hosts in Echtzeit zu überwachen. Die Anwendung wurde mit Next.js, Tailwind CSS und TypeScript entwickelt und für den einfachen Betrieb in einem Docker-Container optimiert.

## Funktionen

- **Echtzeit-Überwachung:** Zeigt den Live-Status (laufend, gestoppt, fehlerhaft) Ihrer Docker-Container an.
- **Multi-Host-Fähigkeit:** Überwachen Sie Container auf dem lokalen Host sowie auf beliebig vielen Remote-Servern über SSH.
- **Automatische Host-Erkennung:** Überwacht standardmäßig den Host, auf dem die Anwendung selbst läuft, ohne zusätzliche Konfiguration.
- **Persistente Konfiguration:** Ihre Liste von überwachten Hosts wird dank eines Docker-Volumes dauerhaft gespeichert.
- **Modernes UI:** Eine saubere, reaktionsschnelle und thematisierbare Benutzeroberfläche mit Dark Mode.
- **Einfache Bereitstellung:** Lässt sich mit einer einzigen `docker-compose.yml`-Datei schnell und einfach bereitstellen.

## Technologie-Stack

- **Frontend:** Next.js (React Framework)
- **Styling:** Tailwind CSS & shadcn/ui
- **Sprache:** TypeScript
- **Backend-Kommunikation (Server Actions):** Genkit (AI-Flows für SSH & lokale Befehle)
- **Containerisierung:** Docker & Docker Compose

## Erste Schritte & Installation

Um Sentinel zu starten, benötigen Sie lediglich Docker und Docker Compose auf Ihrem System.

1.  **Repository klonen (falls noch nicht geschehen):**
    ```bash
    git clone <ihre-repository-url>
    cd <ihr-projektordner>
    ```

2.  **Anwendung bauen und starten:**
    Führen Sie den folgenden Befehl im Hauptverzeichnis des Projekts aus:
    ```bash
    docker-compose up --build -d
    ```
    Dieser Befehl baut das Docker-Image für die Sentinel-Anwendung und startet den Container im Hintergrund (`-d`).

3.  **Anwendung öffnen:**
    Öffnen Sie Ihren Webbrowser und navigieren Sie zu `http://localhost:3000`. Sie sollten das Sentinel-Dashboard sehen, das bereits die Container des lokalen Hosts anzeigt.

## Konfiguration

### Lokaler Host
Standardmäßig ist Sentinel so konfiguriert, dass es den Docker-Daemon des Host-Systems über den Docker-Socket (`/var/run/docker.sock`) ausliest. Dies wird in der `docker-compose.yml` durch das Mounten des Sockets als Volume realisiert:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

Dadurch ist keine weitere Konfiguration für die Überwachung des lokalen Systems erforderlich.

### Remote-Hosts (über SSH)

Um zusätzliche Server zu überwachen, müssen Sie Sentinel den Zugriff über einen privaten SSH-Schlüssel ermöglichen.

1.  **SSH-Schlüssel vorbereiten:**
    Sie benötigen einen privaten SSH-Schlüssel, der berechtigt ist, sich auf den Zielservern anzumelden (in der Regel als `root`-Benutzer).

2.  **Umgebungsvariable `SSH_PRIVATE_KEY` setzen:**
    Fügen Sie die Umgebungsvariable in die `docker-compose.yml`-Datei ein. Der private Schlüssel muss als **einzeiliger String** formatiert sein, wobei alle Zeilenumbrüche durch `\n` ersetzt werden.

    **Beispiel:**
    Originalschlüssel (`my_key`):
    ```
    -----BEGIN OPENSSH PRIVATE KEY-----
    abcde...
    fghij...
    -----END OPENSSH PRIVATE KEY-----
    ```

    Formatierter Schlüssel für die `docker-compose.yml`:
    ```yaml
    environment:
      - SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\nabcde...\nfghij...\n-----END OPENSSH PRIVATE KEY-----
    ```

    Fügen Sie dies in den `sentinel`-Service in Ihrer `docker-compose.yml` ein:
    ```yaml
    services:
      sentinel:
        # ... andere Konfigurationen
        environment:
          - NODE_ENV=production
          - SSH_PRIVATE_KEY=IHR_FORMATIERTER_SCHLÜSSEL
    ```

3.  **Container neu starten:**
    Nachdem Sie die `docker-compose.yml` geändert haben, starten Sie den Container neu, damit die Änderungen wirksam werden:
    ```bash
    docker-compose up --build -d
    ```

4.  **Host im UI hinzufügen:**
    Klicken Sie im Sentinel-Dashboard auf "Add Host" und geben Sie den Namen, die IP-Adresse und den SSH-Port des Remote-Servers ein.

### Persistente Speicherung

Die Liste der von Ihnen hinzugefügten Hosts wird in der Datei `/app/data/hosts.json` innerhalb des Containers gespeichert. Um diese Daten dauerhaft zu sichern, verwendet die `docker-compose.yml` ein benanntes Volume (`sentinel-data`):

```yaml
volumes:
  sentinel-data:
    driver: local
```

Dieses Volume stellt sicher, dass Ihre Host-Liste auch dann erhalten bleibt, wenn Sie den Container neu erstellen oder aktualisieren.

## Projektstruktur

```
.
├── data/
│   └── hosts.json        # Persistente Liste der überwachten Hosts (wird automatisch verwaltet)
├── src/
│   ├── app/              # Next.js App Router, Seiten und Layouts
│   ├── components/       # Wiederverwendbare React-Komponenten (UI-Elemente)
│   ├── ai/               # Genkit-Flows für die Server-Logik (SSH, Dateizugriff)
│   └── lib/              # Hilfsfunktionen, Typdefinitionen etc.
├── Dockerfile            # Definiert den Build-Prozess für das Sentinel-Docker-Image
├── docker-compose.yml    # Definiert den Sentinel-Service und das Daten-Volume
└── next.config.ts        # Next.js-Konfigurationsdatei
```
