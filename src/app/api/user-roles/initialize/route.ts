import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default permissions for the predefined roles
const DEFAULT_PERMISSIONS = [
  'dashboard.view', 'dashboard.analytics', 'cold_room.view', 'cold_room.manage',
  'cold_room.temperature', 'cold_room.inventory', 'qc.view', 'qc.perform',
  'qc.approve', 'qc.export', 'shipments.view', 'shipments.create',
  'shipments.update', 'shipments.track', 'shipments.manifest', 'carriers.view',
  'carriers.manage', 'carriers.assign', 'carriers.track', 'loading.view',
  'loading.create', 'loading.manage', 'loading.assign', 'loading.transit',
  'suppliers.view', 'suppliers.manage', 'suppliers.weigh', 'suppliers.payments',
  'suppliers.visitors', 'customers.view', 'customers.manage', 'customers.quotes',
  'customers.invoices', 'customers.receivables', 'inventory.view',
  'inventory.manage', 'inventory.packaging', 'inventory.reports', 'utilities.view',
  'utilities.record', 'utilities.analyze', 'utilities.reports', 'employees.view',
  'employees.manage', 'employees.attendance', 'employees.payroll', 'admin.users',
  'admin.roles', 'admin.settings', 'admin.audit', 'admin.backup'
];

// Predefined roles from your frontend
const PREDEFINED_ROLES = [
  {
    name: 'Administrator',
    description: 'Full system access with all permissions',
    isDefault: false,
    permissions: DEFAULT_PERMISSIONS
  },
  {
    name: 'Warehouse Manager',
    description: 'Manage warehouse operations, inventory, and quality control',
    isDefault: false,
    permissions: [
      'dashboard.view', 'dashboard.analytics', 'cold_room.view', 'cold_room.manage',
      'cold_room.temperature', 'cold_room.inventory', 'qc.view', 'qc.perform',
      'qc.approve', 'qc.export', 'shipments.view', 'shipments.create',
      'shipments.update', 'shipments.track', 'loading.view', 'loading.create',
      'loading.manage', 'inventory.view', 'inventory.manage', 'inventory.packaging',
      'inventory.reports', 'utilities.view', 'utilities.record', 'employees.view',
      'employees.attendance'
    ]
  },
  {
    name: 'Quality Control Inspector',
    description: 'Perform quality checks and inspections',
    isDefault: false,
    permissions: [
      'qc.view', 'qc.perform', 'cold_room.view', 'cold_room.temperature',
      'inventory.view', 'shipments.view'
    ]
  },
  {
    name: 'Shipping Coordinator',
    description: 'Manage shipments and carrier assignments',
    isDefault: false,
    permissions: [
      'shipments.view', 'shipments.create', 'shipments.update', 'shipments.track',
      'shipments.manifest', 'carriers.view', 'carriers.assign', 'loading.view',
      'loading.create', 'loading.assign', 'loading.transit', 'customers.view'
    ]
  },
  {
    name: 'Supplier Coordinator',
    description: 'Manage supplier relationships and intake',
    isDefault: false,
    permissions: [
      'suppliers.view', 'suppliers.manage', 'suppliers.weigh', 'suppliers.visitors',
      'qc.view', 'inventory.view'
    ]
  },
  {
    name: 'Customer Service',
    description: 'Manage customer accounts and orders',
    isDefault: false,
    permissions: [
      'customers.view', 'customers.manage', 'customers.quotes', 'customers.invoices',
      'customers.receivables', 'shipments.view', 'shipments.track'
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access to view data',
    isDefault: true,
    permissions: [
      'dashboard.view', 'cold_room.view', 'qc.view', 'shipments.view',
      'carriers.view', 'loading.view', 'suppliers.view', 'customers.view',
      'inventory.view', 'utilities.view', 'employees.view'
    ]
  }
];

// POST /api/user-roles/initialize - Initialize with default roles
export async function POST(request: NextRequest) {
  try {
    // Check if roles already exist
    const existingRolesCount = await prisma.userRole.count();
    
    if (existingRolesCount > 0) {
      return NextResponse.json(
        { 
          message: 'Roles already initialized',
          existingCount: existingRolesCount 
        },
        { status: 200 }
      );
    }
    
    // Unset any existing defaults (just in case)
    await prisma.userRole.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
    
    // Create predefined roles
    const createdRoles = await prisma.$transaction(
      PREDEFINED_ROLES.map(role => 
        prisma.userRole.create({
          data: {
            name: role.name,
            description: role.description,
            permissions: JSON.stringify(role.permissions), // Stringify permissions
            isDefault: role.isDefault,
          },
        })
      )
    );
    
    return NextResponse.json({
      message: 'Default roles initialized successfully',
      roles: createdRoles.length,
    });
    
  } catch (error) {
    console.error('Error initializing roles:', error);
    return NextResponse.json(
      { error: 'Failed to initialize default roles' },
      { status: 500 }
    );
  }
}