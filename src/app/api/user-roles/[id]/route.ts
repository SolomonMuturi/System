// /app/api/user-roles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

// Helper function to get user count for a role
async function getUserCount(roleId: string): Promise<number> {
  const count = await prisma.user.count({
    where: { roleId }
  });
  return count;
}

// GET /api/user-roles/[id] - Get single role with user count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Note: params is Promise
) {
  try {
    const { id } = await params; // ✅ AWAIT params first
    const includeUsers = request.nextUrl.searchParams.get('includeUsers') === 'true';
    
    const role = await prisma.userRole.findUnique({
      where: { id },
      include: {
        users: includeUsers ? {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
          take: 50, // Limit to 50 users
        } : false,
      },
    });
    
    if (!role) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Role not found' 
        },
        { status: 404 }
      );
    }
    
    // Get user count
    const userCount = await getUserCount(id);
    
    // Parse permissions from string to array
    const roleWithParsedPermissions = {
      ...role,
      permissions: JSON.parse(role.permissions || '[]') as string[],
      _count: {
        users: userCount,
      },
    };
    
    return NextResponse.json({
      success: true,
      role: roleWithParsedPermissions,
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/user-roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is Promise
) {
  try {
    const { id } = await params; // ✅ AWAIT params first
    const body = await request.json();
    
    // Validate input
    const validatedData = updateRoleSchema.parse(body);
    
    // Check if role exists
    const existingRole = await prisma.userRole.findUnique({
      where: { id },
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Role not found' 
        },
        { status: 404 }
      );
    }
    
    // Check if new name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await prisma.userRole.findUnique({
        where: { name: validatedData.name },
      });
      
      if (nameExists) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Role with this name already exists' 
          },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.permissions !== undefined) updateData.permissions = JSON.stringify(validatedData.permissions);
    if (validatedData.isDefault !== undefined) updateData.isDefault = validatedData.isDefault;
    
    // If setting as default, unset other defaults
    if (validatedData.isDefault === true) {
      await prisma.userRole.updateMany({
        where: { 
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }
    
    const updatedRole = await prisma.userRole.update({
      where: { id },
      data: updateData,
    });
    
    // Get updated user count
    const userCount = await getUserCount(id);
    
    // Parse permissions for response
    const roleWithParsedPermissions = {
      ...updatedRole,
      permissions: JSON.parse(updatedRole.permissions || '[]') as string[],
      _count: {
        users: userCount,
      },
    };
    
    return NextResponse.json({
      success: true,
      role: roleWithParsedPermissions,
      message: 'Role updated successfully'
    });
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
    
    console.error('Error updating role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/user-roles/[id] - Delete role with options
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is Promise
) {
  try {
    const { id } = await params; // ✅ AWAIT params first
    
    // Get query parameters for options
    const url = new URL(request.url);
    const reassignToRoleId = url.searchParams.get('reassignToRoleId');
    const forceDelete = url.searchParams.get('force') === 'true';
    
    // Check if role exists
    const role = await prisma.userRole.findUnique({
      where: { id },
    });
    
    if (!role) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Role not found' 
        },
        { status: 404 }
      );
    }
    
    // Get user count for this role
    const userCount = await getUserCount(id);
    
    // Check if role has users
    if (userCount > 0) {
      // If force delete is requested, unassign users
      if (forceDelete) {
        await prisma.user.updateMany({
          where: { roleId: id },
          data: { roleId: null },
        });
      } 
      // If reassign role is specified
      else if (reassignToRoleId) {
        // Check if target role exists
        const targetRole = await prisma.userRole.findUnique({
          where: { id: reassignToRoleId },
        });
        
        if (!targetRole) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Target role for reassignment not found',
            },
            { status: 404 }
          );
        }
        
        // Reassign users to new role
        await prisma.user.updateMany({
          where: { roleId: id },
          data: { roleId: reassignToRoleId },
        });
      } 
      // Default behavior: prevent deletion with helpful message
      else {
        return NextResponse.json(
          { 
            success: false,
            error: 'Cannot delete role that is assigned to users',
            userCount: userCount,
            suggestions: [
              'Use ?reassignToRoleId=[role-id] to reassign users to another role',
              'Use ?force=true to unassign users from this role',
            ],
            role: {
              id: role.id,
              name: role.name,
              userCount: userCount,
            }
          },
          { status: 400 }
        );
      }
    }
    
    // Prevent deletion of default role unless forced
    if (role.isDefault && !forceDelete) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete default role',
          suggestion: 'Use ?force=true to delete default role',
        },
        { status: 400 }
      );
    }
    
    // Delete the role
    await prisma.userRole.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Role deleted successfully',
        deletedRole: {
          id: role.id,
          name: role.name,
          wasDefault: role.isDefault,
        },
        usersAffected: userCount,
        reassigned: reassignToRoleId ? true : false,
        forceDeleted: forceDelete,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}