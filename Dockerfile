# Builder-Stage: Baut die Next.js-Anwendung
FROM node:18-alpine AS builder

WORKDIR /app

# Abhängigkeiten installieren
COPY package.json ./
RUN npm install

# Quellcode kopieren und Anwendung bauen
COPY . .
RUN npm run build

# ---

# Production-Stage: Erstellt ein schlankes Image für den Betrieb
FROM node:18-alpine AS stage-1

WORKDIR /app

# Fügt notwendige Pakete für native Abhängigkeiten hinzu
# (wichtig für 'mysql2' und 'node-ssh')
RUN apk add --no-cache libc6-compat

# Kopiert die gebaute Anwendung aus der Builder-Stage
COPY --from=builder /app/.next/standalone ./

# Kopiert die statischen Next.js-Assets
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
