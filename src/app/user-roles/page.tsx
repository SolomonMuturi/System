'use client';

import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  Shield, 
  Key, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define permission types
type Permission = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type UserRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
};

// Default permissions based on your schema
const DEFAULT_PERMISSIONS: Permission[] = [
  // Dashboard Permissions
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access to main dashboard', category: 'Dashboard' },
  { id: 'dashboard.analytics', name: 'View Analytics', description: 'Access to analytics charts and reports', category: 'Dashboard' },
  
  // Cold Room Permissions
  { id: 'cold_room.view', name: 'View Cold Rooms', description: 'View cold room inventory and status', category: 'Cold Room' },
  { id: 'cold_room.manage', name: 'Manage Cold Rooms', description: 'Add/edit/delete cold room data', category: 'Cold Room' },
  { id: 'cold_room.temperature', name: 'Monitor Temperature', description: 'View temperature logs and alerts', category: 'Cold Room' },
  { id: 'cold_room.inventory', name: 'Manage Inventory', description: 'Manage cold room inventory entries', category: 'Cold Room' },
  
  // Quality Control Permissions
  { id: 'qc.view', name: 'View QC Records', description: 'View quality check results', category: 'Quality Control' },
  { id: 'qc.perform', name: 'Perform QC Checks', description: 'Create new quality check records', category: 'Quality Control' },
  { id: 'qc.approve', name: 'Approve QC Results', description: 'Approve or reject QC results', category: 'Quality Control' },
  { id: 'qc.export', name: 'Export QC Data', description: 'Export quality check reports', category: 'Quality Control' },
  
  // Shipments Permissions
  { id: 'shipments.view', name: 'View Shipments', description: 'View shipment status and details', category: 'Shipments' },
  { id: 'shipments.create', name: 'Create Shipments', description: 'Create new shipment records', category: 'Shipments' },
  { id: 'shipments.update', name: 'Update Shipments', description: 'Update shipment status and details', category: 'Shipments' },
  { id: 'shipments.track', name: 'Track Shipments', description: 'Track shipment transit and delivery', category: 'Shipments' },
  { id: 'shipments.manifest', name: 'Generate Manifests', description: 'Create shipping manifests', category: 'Shipments' },
  
  // Carrier Management
  { id: 'carriers.view', name: 'View Carriers', description: 'View carrier information', category: 'Carriers' },
  { id: 'carriers.manage', name: 'Manage Carriers', description: 'Add/edit/delete carrier records', category: 'Carriers' },
  { id: 'carriers.assign', name: 'Assign Carriers', description: 'Assign carriers to shipments', category: 'Carriers' },
  { id: 'carriers.track', name: 'Track Carrier Performance', description: 'View carrier ratings and performance', category: 'Carriers' },
  
  // Loading Operations
  { id: 'loading.view', name: 'View Loading Sheets', description: 'View loading sheet records', category: 'Loading' },
  { id: 'loading.create', name: 'Create Loading Sheets', description: 'Create new loading sheets', category: 'Loading' },
  { id: 'loading.manage', name: 'Manage Loading Sheets', description: 'Edit/delete loading sheets', category: 'Loading' },
  { id: 'loading.assign', name: 'Assign to Carriers', description: 'Assign loading sheets to carriers', category: 'Loading' },
  { id: 'loading.transit', name: 'Manage Transit', description: 'Update transit status', category: 'Loading' },
  
  // Supplier Management
  { id: 'suppliers.view', name: 'View Suppliers', description: 'View supplier information', category: 'Suppliers' },
  { id: 'suppliers.manage', name: 'Manage Suppliers', description: 'Add/edit/delete supplier records', category: 'Suppliers' },
  { id: 'suppliers.weigh', name: 'Weight Capture', description: 'Record supplier weight entries', category: 'Suppliers' },
  { id: 'suppliers.payments', name: 'Process Payments', description: 'Process supplier payments', category: 'Suppliers' },
  { id: 'suppliers.visitors', name: 'Manage Visitors', description: 'Manage supplier visitor records', category: 'Suppliers' },
  
  // Customer Management
  { id: 'customers.view', name: 'View Customers', description: 'View customer information', category: 'Customers' },
  { id: 'customers.manage', name: 'Manage Customers', description: 'Add/edit/delete customer records', category: 'Customers' },
  { id: 'customers.quotes', name: 'Manage Quotes', description: 'Create and manage quotes', category: 'Customers' },
  { id: 'customers.invoices', name: 'Manage Invoices', description: 'Create and manage invoices', category: 'Customers' },
  { id: 'customers.receivables', name: 'Accounts Receivable', description: 'Manage accounts receivable', category: 'Customers' },
  
  // Inventory Management
  { id: 'inventory.view', name: 'View Inventory', description: 'View inventory levels', category: 'Inventory' },
  { id: 'inventory.manage', name: 'Manage Inventory', description: 'Update inventory records', category: 'Inventory' },
  { id: 'inventory.packaging', name: 'Manage Packaging', description: 'Manage packaging materials', category: 'Inventory' },
  { id: 'inventory.reports', name: 'Generate Reports', description: 'Generate inventory reports', category: 'Inventory' },
  
  // Utility Management
  { id: 'utilities.view', name: 'View Utilities', description: 'View utility consumption data', category: 'Utilities' },
  { id: 'utilities.record', name: 'Record Readings', description: 'Record utility meter readings', category: 'Utilities' },
  { id: 'utilities.analyze', name: 'Analyze Consumption', description: 'Analyze utility consumption patterns', category: 'Utilities' },
  { id: 'utilities.reports', name: 'Utility Reports', description: 'Generate utility reports', category: 'Utilities' },
  
  // Employee Management
  { id: 'employees.view', name: 'View Employees', name: 'View employee records', category: 'Employees' },
  { id: 'employees.manage', name: 'Manage Employees', description: 'Add/edit/delete employee records', category: 'Employees' },
  { id: 'employees.attendance', name: 'View Attendance', description: 'View employee attendance records', category: 'Employees' },
  { id: 'employees.payroll', name: 'Payroll Management', description: 'Manage payroll and salaries', category: 'Employees' },
  
  // System Administration
  { id: 'admin.users', name: 'Manage Users', description: 'Create and manage user accounts', category: 'Administration' },
  { id: 'admin.roles', name: 'Manage Roles', description: 'Create and manage user roles', category: 'Administration' },
  { id: 'admin.settings', name: 'System Settings', description: 'Configure system settings', category: 'Administration' },
  { id: 'admin.audit', name: 'View Audit Logs', description: 'View system audit logs', category: 'Administration' },
  { id: 'admin.backup', name: 'System Backup', description: 'Perform system backups', category: 'Administration' },
];

// Predefined roles
const PREDEFINED_ROLES = [
  {
    name: 'Administrator',
    description: 'Full system access with all permissions',
    isDefault: false,
    permissions: DEFAULT_PERMISSIONS.map(p => p.id)
  },
  {
    name: 'Warehouse Manager',
    description: 'Manage warehouse operations, inventory, and quality control',
    isDefault: false,
    permissions: [
      'dashboard.view',
      'dashboard.analytics',
      'cold_room.view',
      'cold_room.manage',
      'cold_room.temperature',
      'cold_room.inventory',
      'qc.view',
      'qc.perform',
      'qc.approve',
      'qc.export',
      'shipments.view',
      'shipments.create',
      'shipments.update',
      'shipments.track',
      'loading.view',
      'loading.create',
      'loading.manage',
      'inventory.view',
      'inventory.manage',
      'inventory.packaging',
      'inventory.reports',
      'utilities.view',
      'utilities.record',
      'employees.view',
      'employees.attendance'
    ]
  },
  {
    name: 'Quality Control Inspector',
    description: 'Perform quality checks and inspections',
    isDefault: false,
    permissions: [
      'qc.view',
      'qc.perform',
      'cold_room.view',
      'cold_room.temperature',
      'inventory.view',
      'shipments.view'
    ]
  },
  {
    name: 'Shipping Coordinator',
    description: 'Manage shipments and carrier assignments',
    isDefault: false,
    permissions: [
      'shipments.view',
      'shipments.create',
      'shipments.update',
      'shipments.track',
      'shipments.manifest',
      'carriers.view',
      'carriers.assign',
      'loading.view',
      'loading.create',
      'loading.assign',
      'loading.transit',
      'customers.view'
    ]
  },
  {
    name: 'Supplier Coordinator',
    description: 'Manage supplier relationships and intake',
    isDefault: false,
    permissions: [
      'suppliers.view',
      'suppliers.manage',
      'suppliers.weigh',
      'suppliers.visitors',
      'qc.view',
      'inventory.view'
    ]
  },
  {
    name: 'Customer Service',
    description: 'Manage customer accounts and orders',
    isDefault: false,
    permissions: [
      'customers.view',
      'customers.manage',
      'customers.quotes',
      'customers.invoices',
      'customers.receivables',
      'shipments.view',
      'shipments.track'
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access to view data',
    isDefault: true,
    permissions: [
      'dashboard.view',
      'cold_room.view',
      'qc.view',
      'shipments.view',
      'carriers.view',
      'loading.view',
      'suppliers.view',
      'customers.view',
      'inventory.view',
      'utilities.view',
      'employees.view'
    ]
  }
];

export default function UserRolesPage() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isDefaultRole, setIsDefaultRole] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');

  // Fetch roles from database
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-roles');
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        console.error('Failed to fetch roles');
        toast.error('Failed to load user roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load user roles');
    } finally {
      setLoading(false);
    }
  };

  // Initialize with predefined roles if database is empty
  const initializeRoles = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/user-roles/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: PREDEFINED_ROLES })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Roles initialized successfully');
        fetchRoles();
      } else {
        throw new Error('Failed to initialize roles');
      }
    } catch (error) {
      console.error('Error initializing roles:', error);
      toast.error('Failed to initialize roles');
    } finally {
      setSaving(false);
    }
  };

  // Create new role
  const createRole = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions,
          isDefault: isDefaultRole
        })
      });

      if (response.ok) {
        const newRole = await response.json();
        toast.success('Role created successfully');
        setShowCreateDialog(false);
        resetForm();
        fetchRoles();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create role');
      }
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  // Update existing role
  const updateRole = async () => {
    if (!selectedRole || !roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/user-roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions,
          isDefault: isDefaultRole
        })
      });

      if (response.ok) {
        const updatedRole = await response.json();
        toast.success('Role updated successfully');
        setShowEditDialog(false);
        resetForm();
        fetchRoles();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  // Delete role
  const deleteRole = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/user-roles/${selectedRole.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Role deleted successfully');
        setShowDeleteDialog(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete role');
      }
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.message || 'Failed to delete role');
    } finally {
      setSaving(false);
    }
  };

  // Edit role handler
  const handleEditRole = (role: UserRole) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions);
    setIsDefaultRole(role.isDefault);
    setShowEditDialog(true);
  };

  // Delete role handler
  const handleDeleteRole = (role: UserRole) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setIsDefaultRole(false);
    setPermissionSearch('');
    setSelectedRole(null);
  };

  // Toggle permission
  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Select all permissions in category
  const selectAllInCategory = (category: string) => {
    const categoryPermissions = DEFAULT_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.id);
    
    const hasAllCategoryPermissions = categoryPermissions.every(p => 
      selectedPermissions.includes(p)
    );

    if (hasAllCategoryPermissions) {
      // Deselect all in category
      setSelectedPermissions(prev => 
        prev.filter(id => !categoryPermissions.includes(id))
      );
    } else {
      // Select all in category
      setSelectedPermissions(prev => {
        const newPermissions = [...prev];
        categoryPermissions.forEach(permissionId => {
          if (!newPermissions.includes(permissionId)) {
            newPermissions.push(permissionId);
          }
        });
        return newPermissions;
      });
    }
  };

  // Select all permissions
  const selectAllPermissions = () => {
    const allPermissionIds = DEFAULT_PERMISSIONS.map(p => p.id);
    if (selectedPermissions.length === allPermissionIds.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPermissionIds);
    }
  };

  // Get unique permission categories
  const permissionCategories = Array.from(
    new Set(DEFAULT_PERMISSIONS.map(p => p.category))
  );

  // Filter permissions based on search
  const filteredPermissions = DEFAULT_PERMISSIONS.filter(permission =>
    permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    permission.description.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    permission.id.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    permission.category.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  // Filter roles based on search and category
  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedCategory === 'all') return matchesSearch;
    
    // You could add category filtering here if you add categories to roles
    return matchesSearch;
  });

  // Get category counts for roles
  const getRoleCountByCategory = () => {
    // This is a placeholder - you might want to add categories to roles
    return [
      { category: 'Administrative', count: roles.filter(r => r.isDefault).length },
      { category: 'Custom', count: roles.filter(r => !PREDEFINED_ROLES.some(pr => pr.name === r.name)).length },
      { category: 'Total', count: roles.length }
    ];
  };

  // Copy role permissions as JSON
  const copyPermissionsAsJson = (role: UserRole) => {
    const permissionData = DEFAULT_PERMISSIONS.filter(p => 
      role.permissions.includes(p.id)
    );
    
    const jsonString = JSON.stringify({
      roleName: role.name,
      permissions: permissionData,
      totalPermissions: role.permissions.length
    }, null, 2);
    
    navigator.clipboard.writeText(jsonString);
    toast.success('Permissions copied to clipboard as JSON');
  };

  // Export roles as CSV
  const exportRolesAsCSV = () => {
    const headers = ['Role Name', 'Description', 'Permissions Count', 'Default Role', 'Created At', 'Updated At'];
    const rows = roles.map(role => [
      role.name,
      role.description || '',
      role.permissions.length.toString(),
      role.isDefault ? 'Yes' : 'No',
      new Date(role.createdAt).toLocaleDateString(),
      new Date(role.updatedAt).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-roles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Roles exported as CSV');
  };

  // Load data on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Initialize roles if empty
  useEffect(() => {
    if (!loading && roles.length === 0) {
      // You might want to prompt the user instead of auto-initializing
      // initializeRoles();
    }
  }, [loading, roles.length]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              FreshTrace
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  User Role Management
                </h2>
                <p className="text-muted-foreground">
                  Define roles and assign permissions to control user access across the system.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={exportRolesAsCSV}
                  disabled={roles.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Role
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {getRoleCountByCategory().map((stat) => (
                <Card key={stat.category}>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <div className="text-sm text-muted-foreground">{stat.category} Roles</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="search">Search Roles</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by role name or description..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Filter by Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roles Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>
                  {filteredRoles.length} of {roles.length} roles found
                  {searchTerm && ` • Searching: "${searchTerm}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading roles...</span>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No roles found</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't created any user roles yet.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={initializeRoles} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          'Initialize Default Roles'
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Role
                      </Button>
                    </div>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No matching roles</h3>
                    <p className="text-muted-foreground mb-4">
                      No roles found matching your search criteria.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                {role.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={role.description || ''}>
                                {role.description || 'No description'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline">
                                  {role.permissions.length} permissions
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyPermissionsAsJson(role)}
                                  title="Copy permissions as JSON"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {role.isDefault ? (
                                <Badge className="bg-green-100 text-green-800">Default</Badge>
                              ) : (
                                <Badge variant="outline">Custom</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(role.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRole(role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRole(role)}
                                  disabled={role.isDefault}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permissions Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Available Permissions
                </CardTitle>
                <CardDescription>
                  {DEFAULT_PERMISSIONS.length} system permissions across {permissionCategories.length} categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Permissions</TabsTrigger>
                    {permissionCategories.map(category => (
                      <TabsTrigger key={category} value={category}>
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search permissions..."
                          className="pl-8"
                          value={permissionSearch}
                          onChange={(e) => setPermissionSearch(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllPermissions}
                      >
                        {selectedPermissions.length === DEFAULT_PERMISSIONS.length ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Deselect All
                          </>
                        ) : (
                          'Select All Permissions'
                        )}
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[400px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPermissions.map((permission) => (
                          <Card 
                            key={permission.id}
                            className={`cursor-pointer transition-colors ${
                              selectedPermissions.includes(permission.id)
                                ? 'border-primary bg-primary/5'
                                : ''
                            }`}
                            onClick={() => togglePermission(permission.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{permission.name}</h4>
                                    {selectedPermissions.includes(permission.id) && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {permission.description}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {permission.category}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {permission.id}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  {permissionCategories.map(category => (
                    <TabsContent key={category} value={category} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{category} Permissions</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllInCategory(category)}
                        >
                          {DEFAULT_PERMISSIONS
                            .filter(p => p.category === category)
                            .every(p => selectedPermissions.includes(p.id))
                            ? 'Deselect All'
                            : 'Select All in Category'
                          }
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DEFAULT_PERMISSIONS
                          .filter(p => p.category === category)
                          .map((permission) => (
                            <Card 
                              key={permission.id}
                              className={`cursor-pointer transition-colors ${
                                selectedPermissions.includes(permission.id)
                                  ? 'border-primary bg-primary/5'
                                  : ''
                              }`}
                              onClick={() => togglePermission(permission.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{permission.name}</h4>
                                      {selectedPermissions.includes(permission.id) && (
                                        <Check className="h-4 w-4 text-primary" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new user role with specific permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Warehouse Supervisor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-role">Default Role</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="default-role"
                    checked={isDefaultRole}
                    onCheckedChange={setIsDefaultRole}
                  />
                  <Label htmlFor="default-role" className="cursor-pointer">
                    Set as default role for new users
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe the role's responsibilities and access level..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedPermissions.length} of {DEFAULT_PERMISSIONS.length} selected
                </div>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEFAULT_PERMISSIONS.map((permission) => (
                    <div
                      key={permission.id}
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                        selectedPermissions.includes(permission.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => togglePermission(permission.id)}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                        selectedPermissions.includes(permission.id)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedPermissions.includes(permission.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{permission.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={createRole} disabled={saving || !roleName.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role permissions and settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role-name">Role Name *</Label>
                <Input
                  id="edit-role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Warehouse Supervisor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-default-role">Default Role</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="edit-default-role"
                    checked={isDefaultRole}
                    onCheckedChange={setIsDefaultRole}
                  />
                  <Label htmlFor="edit-default-role" className="cursor-pointer">
                    Set as default role for new users
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe the role's responsibilities and access level..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedPermissions.length} of {DEFAULT_PERMISSIONS.length} selected
                </div>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEFAULT_PERMISSIONS.map((permission) => (
                    <div
                      key={permission.id}
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                        selectedPermissions.includes(permission.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => togglePermission(permission.id)}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                        selectedPermissions.includes(permission.id)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedPermissions.includes(permission.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{permission.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={updateRole} disabled={saving || !roleName.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="text-sm">
              <div className="font-medium mb-1">Role Details:</div>
              <div className="space-y-1 text-muted-foreground">
                <div>Name: {selectedRole?.name}</div>
                <div>Permissions: {selectedRole?.permissions.length}</div>
                <div>Created: {selectedRole?.createdAt ? new Date(selectedRole.createdAt).toLocaleDateString() : 'N/A'}</div>
                {selectedRole?.isDefault && (
                  <div className="text-amber-600 font-medium">
                    ⚠️ This is a default role. Deleting it may affect system users.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteRole}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}