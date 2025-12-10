
# ===== Build Stage =====
# Verwende ein Node.js-Image, um die Anwendung zu bauen.
FROM node:20-alpine AS builder

# Setze das Arbeitsverzeichnis
WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere die Dependencies
RUN npm install

# Kopiere den gesamten Quellcode
COPY . .

# Setze die Umgebungsvariable für den Build
ENV NODE_ENV=production

# Baue die Next.js-Anwendung
RUN npm run build

# Entferne devDependencies, um Platz zu sparen
RUN npm prune --production


# ===== Production Stage =====
# Verwende ein schlankes Basis-Image für die Produktion.
FROM node:20-alpine AS production

# Setze das Arbeitsverzeichnis
WORKDIR /app

# Kopiere die gebaute Anwendung und die Dependencies aus dem Builder-Stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/data ./data
COPY --from=builder /app/package.json ./package.json

# Exponiere den Port, auf dem die Anwendung läuft
EXPOSE 3000

# Setze die Umgebungsvariable für die Produktion
ENV NODE_ENV=production

# Der Befehl zum Starten der Anwendung
CMD ["node", "server.js"]
