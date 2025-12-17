// /api/carrier-assignments/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Generate a short ID that fits VARCHAR(20)
function generateShortId(prefix: string = 'ca'): string {
  const timestamp = Date.now().toString(36).slice(-6); // Last 6 chars
  const random = Math.random().toString(36).substr(2, 3); // 3 random chars
  return `${prefix}${timestamp}${random}`; // Should be < 20 chars
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/carrier-assignments');
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', {
      carrierId: body.carrierId,
      loadingSheetId: body.loadingSheetId,
      status: body.status
    });
    
    // Validate required fields
    if (!body.carrierId || !body.loadingSheetId) {
      return NextResponse.json({
        success: false,
        error: 'carrierId and loadingSheetId are required'
      }, { status: 400 });
    }
    
    // Trim IDs
    const carrierId = body.carrierId.trim();
    const loadingSheetId = body.loadingSheetId.trim();
    
    // Check if carrier exists
    const carrier = await prisma.carriers.findUnique({
      where: { id: carrierId }
    });
    
    if (!carrier) {
      return NextResponse.json({
        success: false,
        error: `Carrier not found with ID: ${carrierId}`
      }, { status: 404 });
    }
    
    // Check if loading sheet exists
    const loadingSheet = await prisma.loading_sheets.findUnique({
      where: { id: loadingSheetId }
    });
    
    if (!loadingSheet) {
      return NextResponse.json({
        success: false,
        error: `Loading sheet not found with ID: ${loadingSheetId}`
      }, { status: 404 });
    }
    
    // Check if assignment already exists
    const existingAssignment = await prisma.carrier_assignments.findFirst({
      where: {
        carrier_id: carrierId,
        loading_sheet_id: loadingSheetId
      }
    });
    
    if (existingAssignment) {
      return NextResponse.json({
        success: false,
        error: 'Assignment already exists for this carrier and loading sheet'
      }, { status: 400 });
    }
    
    // Generate short ID
    const assignmentId = generateShortId();
    console.log('🆔 Generated ID:', assignmentId, 'Length:', assignmentId.length);
    
    // Create assignment with short ID
    const assignment = await prisma.carrier_assignments.create({
      data: {
        id: assignmentId,
        carrier_id: carrierId,
        loading_sheet_id: loadingSheetId,
        assigned_by: 'System',
        status: body.status || 'assigned',
        notes: body.notes || null,
        assigned_at: new Date()
      },
      include: {
        carrier: true,
        loading_sheet: true
      }
    });
    
    console.log('✅ Assignment created:', assignment.id);
    
    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Carrier assigned successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ POST Error:', error.message);
    
    if (error.code === 'P2000') {
      return NextResponse.json({
        success: false,
        error: 'Database field length error. Please try again.'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to assign carrier: ' + error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('📡 GET /api/carrier-assignments');
  
  try {
    const assignments = await prisma.carrier_assignments.findMany({
      include: {
        carrier: true,
        loading_sheet: true
      },
      orderBy: {
        assigned_at: 'desc'
      },
      take: 50
    });
    
    console.log(`✅ Found ${assignments.length} assignments`);
    
    return NextResponse.json({
      success: true,
      data: assignments
    });
    
  } catch (error: any) {
    console.error('❌ GET Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assignments'
    }, { status: 500 });
  }
}