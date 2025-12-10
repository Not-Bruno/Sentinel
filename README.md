# Sentinel - Echtzeit-Monitoring für Docker-Container

![Sentinel Dashboard](https://placehold.co/1200/800/1e293b/ffffff/png?text=Sentinel+Dashboard)

Sentinel ist eine moderne, webbasierte Anwendung zur Echtzeit-Überwachung des Status von Docker-Containern auf verschiedenen Servern. Egal, ob die Container lokal oder auf Remote-Servern via SSH laufen – Sentinel bietet dir den perfekten Überblick, unterstützt durch eine KI-gestützte Backend-Logik und eine persistente MariaDB-Datenbank.

Die Anwendung wurde mit **Next.js** und **Tailwind CSS** entwickelt und ist für einen kinderleichten Betrieb im eigenen Docker-Container optimiert.

---

## ✨ Features

- **Echtzeit-Überwachung:** Sieh live, ob deine Docker-Container laufen, gestoppt sind oder einen Fehler haben.
- **Multi-Host-Fähigkeit:** Überwache Container auf deinem lokalen System und beliebig vielen Remote-Servern über SSH.
- **Persistente Speicherung:** Deine Host-Konfigurationen werden in einer robusten MariaDB-Datenbank gespeichert und bleiben auch nach Neustarts erhalten.
- **Performance-Analyse:** Detaillierte Analyse-Seiten für Server-Performance (CPU, RAM, Disk) und Container-Auslastung mit historischen Graphen.
- **Modernes & Anpassbares UI:** Eine saubere, reaktionsschnelle Benutzeroberfläche mit Dark Mode.
- **Einfache Bereitstellung:** Mit einer einzigen `docker-compose.yml`-Datei ist Sentinel blitzschnell einsatzbereit.

---

## 🛠️ Technologie-Stack

- **Frontend:** Next.js (React Framework)
- **Styling:** Tailwind CSS & shadcn/ui
- **Datenbank:** MariaDB
- **Backend-Logik:** Genkit (für die Verwaltung von SSH-Verbindungen und lokalen Befehlen)
- **Containerisierung:** Docker & Docker Compose

---

## 🚀 Erste Schritte

Um Sentinel zu nutzen, benötigst du lediglich **Docker** und **Docker Compose** auf deinem System.

#### 1. Repository klonen (falls noch nicht geschehen)
```bash
git clone <repository-url>
cd <repository-ordner>
```

#### 2. Anwendung bauen und starten
Führe den folgenden Befehl im Hauptverzeichnis des Projekts aus:
```bash
docker-compose up --build -d
```
Dieser Befehl baut die Docker-Images für Sentinel und die MariaDB-Datenbank, startet die Container im Hintergrund (`-d`) und stellt sicher, dass sie bei einem Neustart des Systems automatisch wieder gestartet werden.

#### 3. Sentinel öffnen
Öffne deinen Webbrowser und navigiere zu `http://localhost:3000`. Du solltest das Sentinel-Dashboard sehen, das bereits die Container deines lokalen Host-Systems anzeigt.

---

## ⚙️ Konfiguration

### Lokaler Host
Standardmäßig liest Sentinel die Docker-Informationen deines Host-Systems über den Docker-Socket (`/var/run/docker.sock`). Dies wird in der `docker-compose.yml` durch das Mounten des Sockets ermöglicht. Für die Überwachung deines lokalen Systems ist **keine weitere Konfiguration nötig**.

### Remote-Hosts (via SSH)
Um zusätzliche Server zu überwachen, muss Sentinel Zugriff über einen privaten SSH-Schlüssel erhalten.

#### 1. SSH-Schlüssel vorbereiten
Du benötigst einen privaten SSH-Schlüssel (z. B. `id_rsa`), der berechtigt ist, sich auf den Zielservern anzumelden. In der Regel erfordert Docker Root-Rechte, daher sollte der Schlüssel für den `root`-Benutzer konfiguriert sein.

#### 2. SSH-Schlüssel für Docker Compose formatieren
Der private Schlüssel muss als **einzeiliger String** in die `docker-compose.yml` eingefügt werden, wobei alle Zeilenumbrüche durch `\n` ersetzt werden.

**Beispiel:**
Dein Originalschlüssel in der Datei `my_key`:
```
-----BEGIN OPENSSH PRIVATE KEY-----
abcde...
fghij...
-----END OPENSSH PRIVATE KEY-----
```

Wird zu diesem einzeiligen String:
```
-----BEGIN OPENSSH PRIVATE KEY-----\nabcde...\nfghij...\n-----END OPENSSH PRIVATE KEY-----
```

#### 3. Schlüssel in `docker-compose.yml` einfügen
Öffne die `docker-compose.yml` und füge den formatierten Schlüssel bei der Umgebungsvariable `SSH_PRIVATE_KEY` ein. Entferne dazu das Kommentarzeichen `#`.

```yaml
services:
  sentinel:
    # ... andere Konfigurationen
    environment:
      # ...
      # Wichtig: Den Schlüssel als einzeiligen String einfügen und das Kommentarzeichen entfernen
      - SSH_PRIVATE_KEY=DEIN_FORMATIERTER_SCHLUESSEL
```

#### 4. Container neu starten
Nachdem du die `docker-compose.yml` geändert hast, starte die Container neu, damit die Änderungen wirksam werden:
```bash
docker-compose up --build -d
```

#### 5. Host im UI hinzufügen
Klicke im Sentinel-Dashboard auf **"Host hinzufügen"** und gib den Namen, die IP-Adresse und den SSH-Port des Remote-Servers ein.

---

## 💾 Persistente Speicherung

Alle deine Host-Informationen und Metriken werden in der MariaDB-Datenbank gespeichert. Die `docker-compose.yml` verwendet ein **named Volume** (`mariadb-data`), um die Datenbankdateien dauerhaft auf deinem Host-System zu sichern, selbst wenn der Datenbank-Container neu erstellt wird.

```yaml
volumes:
  mariadb-data:
    driver: local
```

---

## 📂 Projektstruktur

```
.
├── src/
│   ├── app/              # Next.js App Router, Seiten und Layouts.
│   ├── components/       # Wiederverwendbare React-Komponenten (UI-Elemente).
│   ├── ai/               # Genkit-Flows für die Server-Logik (SSH, DB-Zugriff etc.).
│   └── lib/              # Hilfsfunktionen, Typ-Definitionen und DB-Logik.
├── Dockerfile            # Definiert, wie das Docker-Image für die App gebaut wird.
├── docker-compose.yml    # Definiert die Services für App und Datenbank.
└── next.config.ts        # Konfigurationsdatei für Next.js.
```
