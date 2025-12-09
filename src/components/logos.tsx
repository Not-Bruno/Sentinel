import React from 'react';
import { Server } from 'lucide-react';

const NginxLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M64 128c35.346 0 64-28.654 64-64S99.346 0 64 0 0 28.654 0 64s28.654 64 64 64z" fill="#009639"/><path d="M43.743 32.533h13.928L80.5 68.358V32.533h13.929v62.934H80.5L57.671 59.642v35.825H43.743V32.533z" fill="#fff"/></svg>
);

const PythonLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.227 12.003a2.227 2.227 0 11-4.454 0 2.227 2.227 0 014.454 0z" fill="#FFD43B"/><path d="M12.001 9.778V2.5a2.227 2.227 0 00-2.227-2.227H5.318a2.227 2.227 0 00-2.227 2.227v4.454a2.227 2.227 0 002.227 2.227h4.454c1.23 0 2.228-.998 2.228-2.227v-.226zM9.774 4.727a2.227 2.227 0 110 4.454 2.227 2.227 0 010-4.454z" fill="#306998"/><path d="M12 14.225v7.275a2.227 2.227 0 01-2.227 2.227h-4.454a2.227 2.227 0 01-2.227-2.227v-4.454a2.227 2.227 0 012.227-2.227h4.454c1.23 0 2.228.998 2.228 2.227v.182z" fill="#FFD43B"/><path d="M14.227 19.27a2.227 2.227 0 114.454 0 2.227 2.227 0 01-4.454 0z" fill="#306998"/></svg>
);

const NodejsLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="#339933"><path d="M128 0C57.308 0 0 57.308 0 128s57.308 128 128 128 128-57.308 128-128S198.692 0 128 0zm-14.195 212.441L78.67 127.143l-35.135-4.26V60.75h129.53v105.16l-35.91 42.15-22.38-15.619z"/><path d="M112.593 118.537L82.16 83.033h46.205l-21.72 26.31 16.598 22.12-10.65 9.192z" fill="#fff"/></svg>
);

const PostgresLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#336791" d="M64 128a64 64 0 1 0 0-128a64 64 0 0 0 0 128z"/><path fill="#fff" d="M96 68.2h-8.3v19.4h-9.9V40.2H96v9.5h-9.5v8.5H96v8.2zM67.3 87.6H49.1V40.2h9.9v37.6h8.3V40.2h9.9v47.4zM32 40.2h9.9v47.4H32z"/></svg>
);

const RedisLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#DC382D" d="M128 64c0 35.3-28.7 64-64 64S0 99.3 0 64 28.7 0 64 0s64 28.7 64 64"/><path fill="#fff" d="M84.7 93.3H39.8v-7.1h3.4V41.8h-3.4v-7.1h15.9v7.1h-4.3v44.3h3.4zM68.5 67.5c-3.1 0-5.8-1-8-2.9l4.3-5.7c1.3.9 2.5 1.4 3.7 1.4 1.7 0 2.9-.8 2.9-2.2v-.2c-.1 0-.2.1-.3.1-2.1.8-4.6 1.3-7.5 1.3-7.4 0-11.7-4.1-11.7-10.6 0-5.7 4.1-9.9 10.3-9.9 2.9 0 5.1.4 6.7 1.1l-2.6 6.3c-1.3-.4-2.5-.6-3.8-.6-1.7 0-2.4.6-2.4 1.6 0 .8.6 1.3 2.1 1.9 3.4 1.3 6.9 2.9 6.9 7.7 0 4.3-3.3 7.8-8.9 7.8"/></svg>
);

const NextcloudLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="#0082c9"><path d="M64 128a64 64 0 100-128 64 64 0 000 128z"/><path d="M35.6 51.5a12.9 12.9 0 1125.8 0 12.9 12.9 0 01-25.8 0zM66.7 51.5a12.9 12.9 0 1125.8 0 12.9 12.9 0 01-25.8 0zM51.1 76.5a12.9 12.9 0 1125.8 0 12.9 12.9 0 01-25.8 0z" fill="#fff"/></svg>
);

const PortainerLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#13BEF9"/><path d="M12 6.5l5 3v6l-5 3-5-3v-6l5-3zM9.5 9v4.5l2.5 1.5 2.5-1.5V9l-2.5-1.5L9.5 9z" fill="#13BEF9"/></svg>
);

const TraefikLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9034aa"><path d="M12.93 10.36H8.16l4.77-5.59h-4.3zm-.96 3.28h5.73l-5.73 6.7v-6.7zM3 3v18h18V3H3zm8.97 8.08H3v-2h8.97v2z"/></svg>
);

const WatchtowerLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13.1a1 1 0 000 1.8V17a2 2 0 002 2h16a2 2 0 002-2v-2.1a1 1 0 000-1.8V7a2 2 0 00-2-2H4a2 2 0 00-2 2v6.1zM12 12a5 5 0 100-10 5 5 0 000 10zM12 12a2 2 0 100-4 2 2 0 000 4z"/></svg>
);


// Fügen Sie hier weitere Logo-Komponenten hinzu...

const serviceLogos: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  nginx: NginxLogo,
  python: PythonLogo,
  node: NodejsLogo,
  postgres: PostgresLogo,
  redis: RedisLogo,
  nextcloud: NextcloudLogo,
  portainer: PortainerLogo,
  traefik: TraefikLogo,
  watchtower: WatchtowerLogo,
  // Fügen Sie hier weitere Mappings hinzu
};

export const getContainerLogo = (imageName: string): React.FC<React.SVGProps<SVGSVGElement>> => {
  const lowerCaseImageName = imageName.toLowerCase();
  
  for (const key in serviceLogos) {
    if (lowerCaseImageName.includes(key)) {
      return serviceLogos[key];
    }
  }

  return Server; // Standard-Icon, wenn kein passendes Logo gefunden wird
};
