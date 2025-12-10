# Stage 1: Build-Umgebung
# Nutzt ein schlankes Node.js-Image auf Alpine-Basis, um alle Abhängigkeiten zu installieren und die App zu bauen.
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY package*.json ./

# Installiere alle Dependencies (einschließlich devDependencies für den Build-Prozess)
RUN npm install

# Kopiere den gesamten Quellcode in das Image
COPY . .

# Baue die Next.js-Anwendung für die Produktion
RUN npm run build

# Entferne devDependencies, um die node_modules-Größe zu reduzieren, bevor wir sie kopieren
RUN npm prune --production

# Stage 2: Produktions-Umgebung
# Nutzt dasselbe schlanke Basis-Image, aber ohne die Build-Tools und den Quellcode.
FROM node:20-alpine AS production
WORKDIR /app

# Setze die Umgebungsvariable auf Produktion
ENV NODE_ENV=production

# Erstelle ein Verzeichnis für persistente Daten, falls es nicht existiert
RUN mkdir -p /app/data

# Kopiere die gebaute Anwendung aus dem Builder-Stage
# Das .next-Verzeichnis enthält den gesamten optimierten Code.
COPY --from=builder /app/.next ./.next
# Kopiere nur die notwendigen Production-Abhängigkeiten
COPY --from=builder /app/node_modules ./node_modules
# Kopiere die Konfigurationsdateien
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts


# Die Anwendung läuft standardmäßig auf Port 3000
EXPOSE 3000

# Der Befehl zum Starten der Anwendung
CMD ["npm", "start"]
