import SentinelPage from './sentinel-page';
import type { Host } from '@/lib/types';

interface HomePageProps {
  hosts: Host[];
  setHosts: (hosts: Host[]) => void;
  addHost: (data: { name: string; ipAddress: string; sshPort: number }) => void;
}

export default function Home({ hosts, setHosts, addHost }: HomePageProps) {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <SentinelPage hosts={hosts} setHosts={setHosts} addHost={addHost} />
    </div>
  );
}
