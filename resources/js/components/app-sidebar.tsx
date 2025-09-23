import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { controll, dashboard } from '@/routes';
import device from '@/routes/device';
import promo from '@/routes/promo';
import histori from '@/routes/histori';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChartColumn, ClipboardCheck, Gift, Joystick, LayoutGrid, Satellite, Shield, Tags, Users } from 'lucide-react';
import AppLogo from './app-logo';
import user from '@/routes/user';
import role from '@/routes/role';
import paket from '@/routes/paket';

const mainNavItems: NavItem[] = [
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
    {
        title: 'Role',
        href: role.index.url(),
        icon: Shield,
    },
];

export function AppSidebar() {
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
