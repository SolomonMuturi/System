// app/api/rejects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all rejects
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/rejects called');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const order = searchParams.get('order') || 'desc';
    
    const rejects = await prisma.rejects.findMany({
      take: limit,
      orderBy: {
        rejected_at: order as 'asc' | 'desc'
      }
    });
    
    // Convert Decimal to Number for frontend
const transformedRejects = rejects.map(reject => {
  // Ensure rejected_at is a valid date
  let rejectedAt = reject.rejected_at;
  if (!(rejectedAt instanceof Date) || isNaN(rejectedAt.getTime())) {
    rejectedAt = new Date();
  }
  
  return {
    id: reject.id,
    weight_entry_id: reject.weight_entry_id || '',
    pallet_id: reject.pallet_id,
    supplier_name: reject.supplier_name,
    driver_name: reject.driver_name || '',
    vehicle_plate: reject.vehicle_plate || '',
    region: reject.region || '',
    fuerte_weight: reject.fuerte_weight ? parseFloat(reject.fuerte_weight.toString()) : 0,
    fuerte_crates: reject.fuerte_crates || 0,
    hass_weight: reject.hass_weight ? parseFloat(reject.hass_weight.toString()) : 0,
    hass_crates: reject.hass_crates || 0,
    total_rejected_weight: reject.total_rejected_weight ? parseFloat(reject.total_rejected_weight.toString()) : 0,
    total_rejected_crates: reject.total_rejected_crates || 0,
    variance: reject.variance ? parseFloat(reject.variance.toString()) : 0,
    reason: reject.reason || '',
    notes: reject.notes || '',
    rejected_at: rejectedAt.toISOString(), // Use validated date
    created_by: reject.created_by,
    created_at: reject.created_at.toISOString(),
    updated_at: reject.updated_at.toISOString()
  };
});
    
    return NextResponse.json(transformedRejects);
    
  } catch (error: any) {
    console.error('Error fetching rejects:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch rejects',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST new reject
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.pallet_id || !body.supplier_name) {
      return NextResponse.json(
        { error: 'Pallet ID and supplier name are required' },
        { status: 400 }
      );
    }
    
    // Create new reject entry
    const newReject = await prisma.rejects.create({
      data: {
        weight_entry_id: body.weight_entry_id || null,
        pallet_id: body.pallet_id,
        supplier_name: body.supplier_name,
        driver_name: body.driver_name || '',
        vehicle_plate: body.vehicle_plate || '',
        region: body.region || '',
        fuerte_weight: body.fuerte_weight || 0,
        fuerte_crates: body.fuerte_crates || 0,
        hass_weight: body.hass_weight || 0,
        hass_crates: body.hass_crates || 0,
        total_rejected_weight: body.total_rejected_weight || 
          ((body.fuerte_weight || 0) + (body.hass_weight || 0)),
        total_rejected_crates: body.total_rejected_crates || 
          ((body.fuerte_crates || 0) + (body.hass_crates || 0)),
        variance: body.variance || 0,
        reason: body.reason || '',
        notes: body.notes || '',
        rejected_at: new Date(body.rejected_at || new Date()),
        created_by: body.created_by || 'Weight Capture Station'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: newReject.id,
        pallet_id: newReject.pallet_id,
        supplier_name: newReject.supplier_name,
        total_rejected_weight: parseFloat(newReject.total_rejected_weight?.toString() || '0'),
        rejected_at: newReject.rejected_at.toISOString()
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating reject:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create reject entry',
        details: error.message
      },
      { status: 500 }
    );
  }
}