import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { controll, dashboard } from '@/routes';
import device from '@/routes/device';
import histori from '@/routes/histori';
import paket from '@/routes/paket';
import promo from '@/routes/promo';
import user from '@/routes/user';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChartColumn, ClipboardCheck, Gift, Joystick, Satellite, Tags, Users } from 'lucide-react';
import AppLogo from './app-logo';

// Menu untuk pemilik (akses semua)
const pemilikNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: ChartColumn,
    },
    {
        title: 'Controll',
        href: controll(),
        icon: Joystick,
    },
    {
        title: 'Histori',
        href: histori.index.url(),
        icon: ClipboardCheck,
    },
    {
        title: 'Perangkat',
        href: device.index.url(),
        icon: Satellite,
    },
    {
        title: 'Promo',
        href: promo.index.url(),
        icon: Tags,
    },
    {
        title: 'Paket',
        href: paket.index.url(),
        icon: Gift,
    },
    {
        title: 'User',
        href: user.index.url(),
        icon: Users,
    },
];

const penanggungJawabNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: ChartColumn,
    },
    {
        title: 'Controll',
        href: controll(),
        icon: Joystick,
    },
    {
        title: 'Histori',
        href: histori.index.url(),
        icon: ClipboardCheck,
    },
    {
        title: 'Promo',
        href: promo.index.url(),
        icon: Tags,
    },
    {
        title: 'Paket',
        href: paket.index.url(),
        icon: Gift,
    },
    {
        title: 'User',
        href: user.index.url(),
        icon: Users,
    },
];

// Menu untuk karyawan (akses terbatas)
const karyawanNavItems: NavItem[] = [
    {
        title: 'Controll',
        href: controll(),
        icon: Joystick,
    },
    {
        title: 'Histori',
        href: histori.index.url(),
        icon: ClipboardCheck,
    },
    {
        title: 'Promo',
        href: promo.index.url(),
        icon: Tags,
    },
    {
        title: 'Paket',
        href: paket.index.url(),
        icon: Gift,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    // Tentukan menu berdasarkan role
    const getNavItems = (): NavItem[] => {
        if (!user?.role) {
            return karyawanNavItems; // Default ke karyawan jika role tidak ada
        }

        switch (user.role.name) {
            case 'pemilik':
                return pemilikNavItems;
            case 'super admin':
                return pemilikNavItems;
            case 'penanggung jawab':
                return penanggungJawabNavItems;
            case 'karyawan':
                return karyawanNavItems;
            default:
                return karyawanNavItems;
        }
    };

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={getNavItems()} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
