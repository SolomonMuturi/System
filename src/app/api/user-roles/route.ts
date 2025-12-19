import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  isDefault: z.boolean().default(false),
});

const updateRoleSchema = createRoleSchema.partial();

// GET /api/user-roles - Get all roles with user counts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const includeUsers = searchParams.get('includeUsers') === 'true';

    let roles;
    
    if (search) {
      roles = await prisma.userRole.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
        include: {
          users: includeUsers ? {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            }
          } : false,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      roles = await prisma.userRole.findMany({
        include: {
          users: includeUsers ? {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            }
          } : false,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Parse permissions from string to array
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: JSON.parse(role.permissions || '[]') as string[],
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      users: includeUsers ? role.users : undefined,
    }));

    return NextResponse.json({ 
      success: true,
      roles: formattedRoles,
      count: formattedRoles.length 
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/user-roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createRoleSchema.parse(body);
    
    // Check if role name already exists
    const existingRole = await prisma.userRole.findUnique({
      where: { name: validatedData.name },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Role with this name already exists' 
        },
        { status: 400 }
      );
    }
    
    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.userRole.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    
    const role = await prisma.userRole.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        permissions: JSON.stringify(validatedData.permissions), // Stringify the array
        isDefault: validatedData.isDefault,
      },
    });
    
    // Parse permissions for response
    const roleWithParsedPermissions = {
      ...role,
      permissions: JSON.parse(role.permissions || '[]') as string[],
    };
    
    return NextResponse.json(
      { 
        success: true, 
        role: roleWithParsedPermissions,
        message: 'Role created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    console.error('Error creating role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/user-roles - Bulk delete
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Array of role IDs is required' 
        },
        { status: 400 }
      );
    }
    
    // Check if any role has users before deleting
    const rolesWithUsers = await prisma.userRole.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    const rolesWithAssignedUsers = rolesWithUsers.filter(role => role._count.users > 0);
    
    if (rolesWithAssignedUsers.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Some roles have assigned users and cannot be deleted',
          roles: rolesWithAssignedUsers.map(r => ({
            id: r.id,
            name: r.name,
            userCount: r._count.users
          }))
        },
        { status: 400 }
      );
    }
    
    const deleted = await prisma.userRole.deleteMany({
      where: {
        id: { in: ids },
      },
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: `Successfully deleted ${deleted.count} role(s)` 
      }
    );
  } catch (error) {
    console.error('Error deleting roles:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/user-roles - Bulk update
export async function PATCH(request: NextRequest) {
  try {
    const { ids, data } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Array of role IDs is required' 
        },
        { status: 400 }
      );
    }
    
    // Validate update data
    const validatedData = updateRoleSchema.parse(data);
    
    // Stringify permissions if provided
    const updateData: any = { ...validatedData };
    if (updateData.permissions) {
      updateData.permissions = JSON.stringify(updateData.permissions);
    }
    
    // If setting roles as default, unset other defaults first
    if (validatedData.isDefault === true) {
      await prisma.userRole.updateMany({
        where: { 
          isDefault: true,
          id: { notIn: ids }
        },
        data: { isDefault: false },
      });
    }
    
    const updated = await prisma.userRole.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: `Successfully updated ${updated.count} role(s)` 
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    console.error('Error updating roles:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}