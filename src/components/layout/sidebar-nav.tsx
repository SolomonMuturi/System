'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Truck,
  Weight,
  Warehouse,
  Thermometer,
  ShieldCheck,
  Cog,
  Shield,
  Boxes,
  Zap,
  FlaskConical,
  Grape,
  DoorOpen,
  DoorClosed,
  MapPin,
  List,
  CalendarCheck,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Separator } from '../ui/separator';
import Link from 'next/link';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string; // Single permission required
  permissions?: string[]; // Multiple permissions (any of them)
}

// Define all navigation items with their required permissions
const allNavItems: NavItem[] = [
  // Dashboard
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  
  // Analytics
  // { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'dashboard.analytics' },
  // { name: 'BI Features', href: '/bi-features', icon: BrainCircuit, permission: 'dashboard.analytics' },
  
  // Suppliers
  { name: 'Suppliers', href: '/suppliers', icon: Grape, permissions: ['suppliers.view', 'suppliers.manage'] },
  
  // HR - Employee Management
  { 
    name: 'Employees', 
    href: '/employees', 
    icon: Briefcase,
    // Check for ANY employee permission
    permissions: [
      'employees.overview.view',
      'employees.checkin.view',
      'employees.designation.view',
      'employees.checkout.view',
      'employees.list.view',
      'employees.attendance.view',
      'employees.create',
      'employees.edit',
    ]
  },
  
  // Access Management
  { name: 'Visitor Log', href: '/visitor-management', icon: Users, permission: 'suppliers.visitors' },
  { name: 'Vehicle Log', href: '/vehicle-management', icon: Truck, permission: 'carriers.view' },
  
  // Operations
  { name: 'Intake', href: '/weight-capture', icon: Weight, permission: 'suppliers.weigh' },
  { name: 'Quality Control', href: '/quality-control', icon: FlaskConical, permissions: ['qc.view', 'qc.perform'] },
  // UPDATED: Counting now requires counting.perform instead of inventory.view
  { name: 'Counting', href: '/warehouse', icon: Warehouse, permission: 'counting.perform' },
  { name: 'Cold Room', href: '/cold-room', icon: Thermometer, permissions: ['cold_room.view', 'cold_room.temperature'] },
  { name: 'Shipments', href: '/shipments', icon: Truck, permissions: ['shipments.view', 'shipments.track'] },
  { name: 'Carriers', href: '/carriers', icon: Briefcase, permissions: ['carriers.view', 'carriers.manage'] },
  { name: 'Loading', href: '/outbound', icon: Truck, permissions: ['loading.view', 'loading.create'] },
  // UPDATED: Inventory requires inventory.view or inventory.manage
  { name: 'Inventory', href: '/inventory', icon: Boxes, permissions: ['inventory.view', 'inventory.manage'] },
  { name: 'Utility Management', href: '/utility', icon: Zap, permissions: ['utilities.view', 'utilities.record'] },
  
  // Administration
  { name: 'Reports', href: '/reports', icon: FileText, permission: 'admin.audit' },
  { name: 'Standard Procedures', href: '/sop', icon: FileText, permission: 'admin.settings' },
  { name: 'User Roles', href: '/user-roles', icon: ShieldCheck, permissions: ['admin.roles', 'admin.users'] },
  { name: 'Security Center', href: '/security', icon: Shield, permissions: ['admin.settings', 'admin.users'] },
  { name: 'Settings', href: '/settings', icon: Cog, permission: 'admin.settings' },
];

// Categorize the nav items
const getNavItemsByCategory = () => {
  const mainItems = allNavItems.filter(item => 
    ['/dashboard', '/analytics', '/bi-features', '/suppliers'].includes(item.href)
  );
  
  const hrItems = allNavItems.filter(item => 
    item.href === '/employees'
  );
  
  const accessItems = allNavItems.filter(item => 
    ['/visitor-management', '/vehicle-management'].includes(item.href)
  );
  
  const operationsItems = allNavItems.filter(item => 
    [
      '/weight-capture', '/quality-control', '/warehouse', '/cold-room',
      '/shipments', '/carriers', '/outbound', '/inventory', '/utility'
    ].includes(item.href)
  );
  
  const adminItems = allNavItems.filter(item => 
    ['/reports', '/sop', '/user-roles', '/security', '/settings'].includes(item.href)
  );
  
  return { mainItems, hrItems, accessItems, operationsItems, adminItems };
};

export function SidebarNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  const userPermissions = (session?.user as any)?.permissions || [];
  const userRole = (session?.user as any)?.role || 'No Role';
  
  // Helper function to check permissions
  const hasAccess = (item: NavItem): boolean => {
    // Admin has access to everything
    if (userRole === 'Administrator' || userPermissions.includes('admin.all')) {
      return true;
    }
    
    // Special handling for Employees section - Check for ANY employee permission
    if (item.href === '/employees') {
      const hasAnyEmployeePermission = userPermissions.some(perm => 
        perm.startsWith('employees.')
      );
      return hasAnyEmployeePermission;
    }
    
    // Check single permission
    if (item.permission) {
      return userPermissions.includes(item.permission);
    }
    
    // Check multiple permissions (any of them)
    if (item.permissions && item.permissions.length > 0) {
      return item.permissions.some(perm => userPermissions.includes(perm));
    }
    
    // If no permission specified, allow access
    return true;
  };
  
  // Filter items based on permissions
  const { mainItems, hrItems, accessItems, operationsItems, adminItems } = getNavItemsByCategory();
  
  const visibleMainItems = mainItems.filter(hasAccess);
  const visibleHrItems = hrItems.filter(hasAccess);
  const visibleAccessItems = accessItems.filter(hasAccess);
  const visibleOperationsItems = operationsItems.filter(hasAccess);
  const visibleAdminItems = adminItems.filter(hasAccess);
  
  // Check if we should show HR section
  const shouldShowHRSection = visibleHrItems.length > 0;
  
  const NavGroup = ({ title, items }: { title: string, items: NavItem[] }) => {
    if (items.length === 0) return null;
    return (
        <div className="p-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight text-sidebar-foreground">
                {title}
            </h2>
            <SidebarMenu>
                {items.map(item => (
                    <SidebarMenuItem key={`${item.name}-${item.href}`}>
                        <SidebarMenuButton
                            isActive={pathname === item.href || pathname?.startsWith(`${item.href}/`)}
                            asChild
                            tooltip={item.name}
                            variant={pathname === item.href || pathname?.startsWith(`${item.href}/`) ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
    );
  };

  return (
    <div className="space-y-2">
        <NavGroup title="Main" items={visibleMainItems} />
        
        {shouldShowHRSection && (
          <>
            <NavGroup title="HR" items={visibleHrItems} />
          </>
        )}
        
        {visibleAccessItems.length > 0 && (
          <>
            <NavGroup title="Access Control" items={visibleAccessItems} />
            <Separator />
          </>
        )}
        
        <NavGroup title="Operations" items={visibleOperationsItems} />
        
        {visibleAdminItems.length > 0 && (
          <>
            <Separator />
            <NavGroup title="Administration" items={visibleAdminItems} />
          </>
        )}
    </div>
  );
}