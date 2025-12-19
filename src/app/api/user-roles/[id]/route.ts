import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch single role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await prisma.userRole.findUnique({
      where: { id: params.id },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT: Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const role = await prisma.userRole.findUnique({
      where: { id: params.id },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts
    if (body.name && body.name !== role.name) {
      const existingRole = await prisma.userRole.findUnique({
        where: { name: body.name },
      });
      
      if (existingRole) {
        return NextResponse.json(
          { success: false, error: 'Role name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedRole = await prisma.userRole.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        permissions: body.permissions,
        isDefault: body.isDefault,
      },
    });

    return NextResponse.json({ success: true, role: updatedRole });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await prisma.userRole.findUnique({
      where: { id: params.id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if role has users
    if (role._count.users > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete role assigned to users',
          userCount: role._count.users 
        },
        { status: 400 }
      );
    }

    await prisma.userRole.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Role deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}