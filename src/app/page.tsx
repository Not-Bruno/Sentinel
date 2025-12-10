import SentinelPage from './sentinel-page';
import type { Host } from '@/lib/types';

interface HomePageProps {
  hosts: Host[];
  addHost: (data: { name: string; ipAddress: string; sshPort: number }) => void;
  loading: boolean;
  refreshAllHosts: (hosts: Host[]) => void;
}

export default function Home({ hosts, addHost, loading, refreshAllHosts }: HomePageProps) {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <SentinelPage hosts={hosts} addHost={addHost} loading={loading} refreshAllHosts={refreshAllHosts} />
    </div>
  );
}

    