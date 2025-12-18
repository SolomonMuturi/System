// src/app/api/inventory/packaging/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH: Update individual packaging material
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`PATCH /api/inventory/packaging/${id} - Updating:`, body);

    // Find the material
    const existingMaterial = await prisma.packaging_materials.findUnique({
      where: { id }
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'Packaging material not found' },
        { status: 404 }
      );
    }

    // Update the material
    const updatedMaterial = await prisma.packaging_materials.update({
      where: { id },
      data: {
        ...body,
        lastUsedDate: new Date(),
        updated_at: new Date(),
      }
    });

    console.log('✅ Updated packaging material:', updatedMaterial.id);
    
    // Transform response
    const transformedMaterial = {
      id: updatedMaterial.id,
      name: updatedMaterial.name,
      category: updatedMaterial.category,
      unit: updatedMaterial.unit as 'pieces' | 'rolls' | 'units' | 'kg' | 'sheets' | 'meters',
      currentStock: updatedMaterial.currentStock,
      reorderLevel: updatedMaterial.reorderLevel,
      dimensions: updatedMaterial.dimensions || undefined,
      lastUsedDate: updatedMaterial.lastUsedDate.toISOString(),
      consumptionRate: updatedMaterial.consumptionRate as 'high' | 'medium' | 'low',
    };
    
    return NextResponse.json(transformedMaterial);
    
  } catch (error: any) {
    console.error('Error updating packaging material:', error);
    return NextResponse.json(
      { error: 'Failed to update packaging material: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove packaging material
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    // Delete from database
    await prisma.packaging_materials.delete({
      where: { id }
    });

    console.log('✅ Deleted packaging material:', id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Packaging material deleted successfully' 
    });
    
  } catch (error: any) {
    console.error('Error deleting packaging material:', error);
    return NextResponse.json(
      { error: 'Failed to delete packaging material: ' + error.message },
      { status: 500 }
    );
  }
}