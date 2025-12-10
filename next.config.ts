

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Diese Konfiguration weist Next.js an, die angegebenen Pakete nicht
  // in den Server-Build zu bündeln. Das ist entscheidend für Pakete mit
  // nativen Abhängigkeiten wie `ssh2`, die zur Build-Zeit Fehler verursachen.
  // Sie werden stattdessen zur Laufzeit aus `node_modules` geladen.
  serverExternalPackages: ['node-ssh', 'ssh2'],
};

module.exports = nextConfig;
