import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default permissions matching your frontend
const DEFAULT_PERMISSIONS = [
  'dashboard.view', 'dashboard.analytics', 'cold_room.view', 'cold_room.manage',
  'cold_room.temperature', 'cold_room.inventory', 'qc.view', 'qc.perform',
  // ... Add all other permissions from your frontend DEFAULT_PERMISSIONS array
];

// Predefined roles matching your frontend PREDEFINED_ROLES
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
  // ... Add other roles from your PREDEFINED_ROLES array
];

export async function POST(request: NextRequest) {
  try {
    // Check if roles already exist
    const existingCount = await prisma.userRole.count();
    
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Roles already exist',
        count: existingCount
      });
    }

    // Create all predefined roles
    for (const roleData of PREDEFINED_ROLES) {
      await prisma.userRole.create({
        data: roleData
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Default roles initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize roles' },
      { status: 500 }
    );
  }
}