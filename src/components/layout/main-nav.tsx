
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Server, Box } from 'lucide-react';

const links = [
    { href: '/', label: 'Monitoring Übersicht', icon: LayoutDashboard },
    { href: '/server-performance', label: 'Server-Performance', icon: Server },
    { href: '/monitoring', label: 'Container-Analytik', icon: Box },
];

export function MainNav() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
            {links.map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className={cn(
                        'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                        pathname === href ? 'text-primary' : 'text-muted-foreground'
                    )}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </Link>
            ))}
        </nav>
    );
}
