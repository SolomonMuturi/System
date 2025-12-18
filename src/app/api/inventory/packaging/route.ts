// src/app/api/inventory/packaging/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Fetch all packaging materials
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/inventory/packaging - Fetching packaging materials');
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Fetch from database
    const materials = await prisma.packaging_materials.findMany({
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    });
    
    console.log(`✅ Retrieved ${materials.length} packaging materials from database`);
    
    // Transform to match frontend interface
    const transformedMaterials = materials.map(material => ({
      id: material.id,
      name: material.name,
      category: material.category,
      unit: material.unit as 'pieces' | 'rolls' | 'units' | 'kg' | 'sheets' | 'meters',
      currentStock: material.currentStock,
      reorderLevel: material.reorderLevel,
      dimensions: material.dimensions || undefined,
      lastUsedDate: material.lastUsedDate.toISOString(),
      consumptionRate: material.consumptionRate as 'high' | 'medium' | 'low',
    }));
    
    return NextResponse.json(transformedMaterials);
  } catch (error: any) {
    console.error('Error fetching packaging materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packaging materials' },
      { status: 500 }
    );
  }
}

// POST: Create new packaging material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/inventory/packaging - Creating new material:', body);
    
    // Validate required fields
    if (!body.name || !body.category || !body.unit) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, unit' },
        { status: 400 }
      );
    }

    // Create in database
    const newMaterial = await prisma.packaging_materials.create({
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        currentStock: body.currentStock || 0,
        reorderLevel: body.reorderLevel || 10,
        dimensions: body.dimensions || null,
        lastUsedDate: new Date(body.lastUsedDate || new Date()),
        consumptionRate: body.consumptionRate || 'medium',
      }
    });

    console.log('✅ Created new packaging material:', newMaterial.id);
    
    // Transform response
    const transformedMaterial = {
      id: newMaterial.id,
      name: newMaterial.name,
      category: newMaterial.category,
      unit: newMaterial.unit as 'pieces' | 'rolls' | 'units' | 'kg' | 'sheets' | 'meters',
      currentStock: newMaterial.currentStock,
      reorderLevel: newMaterial.reorderLevel,
      dimensions: newMaterial.dimensions || undefined,
      lastUsedDate: newMaterial.lastUsedDate.toISOString(),
      consumptionRate: newMaterial.consumptionRate as 'high' | 'medium' | 'low',
    };
    
    return NextResponse.json(transformedMaterial, { status: 201 });
  } catch (error: any) {
    console.error('Error creating packaging material:', error);
    return NextResponse.json(
      { error: 'Failed to create packaging material: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update packaging material (for bulk updates)
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id || id === 'packaging') {
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