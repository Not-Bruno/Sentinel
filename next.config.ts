

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Diese Konfiguration weist Next.js an, die angegebenen Pakete nicht
  // in den Server-Build zu bündeln. Das ist entscheidend für Pakete mit
  // nativen Abhängigkeiten wie `ssh2`, die zur Build-Zeit Fehler verursachen.
  // Sie werden stattdessen zur Laufzeit aus `node_modules` geladen.
  experimental: {
    serverComponentsExternalPackages: ['node-ssh', 'ssh2'],
  },
};

module.exports = nextConfig;
