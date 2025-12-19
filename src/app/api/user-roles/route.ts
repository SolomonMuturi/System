import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all roles
export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.userRole.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      success: true, 
      roles 
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST: Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await prisma.userRole.findUnique({
      where: { name: body.name },
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role name already exists' },
        { status: 400 }
      );
    }

    const role = await prisma.userRole.create({
      data: {
        name: body.name,
        description: body.description || '',
        permissions: body.permissions || [],
        isDefault: body.isDefault || false,
      },
    });

    return NextResponse.json(
      { success: true, role },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}