import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper functions
function cleanString(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}

function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Generate a short unique ID (max 20 chars)
function generateShortId(prefix: string = 'ls'): string {
  const timestamp = Date.now().toString(36).slice(-6); // Last 6 chars
  const random = Math.random().toString(36).substr(2, 3); // 3 random chars
  return `${prefix}${timestamp}${random}`; // Should be < 20 chars
}

// GET: Fetch loading sheets
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Loading Sheets API: Fetching...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const client = cleanString(searchParams.get('client'));
    const container = cleanString(searchParams.get('container'));
    const billNumber = cleanString(searchParams.get('billNumber'));
    const startDate = cleanString(searchParams.get('startDate'));
    const endDate = cleanString(searchParams.get('endDate'));
    const includePallets = searchParams.get('includePallets') !== 'false';
    const assignedOnly = searchParams.get('assignedOnly') === 'true';
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';

    // Build where clause
    const where: any = {};

    if (client) {
      where.client = { contains: client, mode: 'insensitive' };
    }

    if (container) {
      where.container = { contains: container, mode: 'insensitive' };
    }

    if (billNumber) {
      where.bill_number = { contains: billNumber, mode: 'insensitive' };
    }

    if (startDate && endDate) {
      where.loading_date = {
        gte: parseDate(startDate),
        lte: parseDate(endDate)
      };
    }

    // Filter by assignment status
    if (assignedOnly) {
      where.assigned_carrier_id = { not: null };
    } else if (unassignedOnly) {
      where.assigned_carrier_id = null;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Define include condition
    const include = includePallets ? {
      loading_pallets: {
        orderBy: { pallet_no: 'asc' }
      }
    } : {};

    // Fetch loading sheets
    const [loadingSheets, totalCount] = await Promise.all([
      prisma.loading_sheets.findMany({
        where,
        include,
        orderBy: { loading_date: 'desc' },
        skip,
        take: limit
      }),
      prisma.loading_sheets.count({ where })
    ]);

    console.log(`✅ Found ${loadingSheets.length} loading sheet(s) out of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      data: loadingSheets,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching loading sheets:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch loading sheets', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: Create a new loading sheet
// POST: Create a new loading sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('💾 Loading Sheets API: Saving loading sheet...', {
      exporter: body.exporter,
      client: body.client,
      palletsCount: body.pallets?.length || 0,
      billNumber: body.billNumber
    });

    // Validate required fields
    if (!body.exporter) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: exporter is required' 
        },
        { status: 400 }
      );
    }

    if (!body.billNumber) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: billNumber is required' 
        },
        { status: 400 }
      );
    }

    if (!body.container) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: container is required' 
        },
        { status: 400 }
      );
    }

    // Validate loading date
    const loadingDate = parseDate(body.loadingDate);
    if (!loadingDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid loading date format' 
        },
        { status: 400 }
      );
    }

    // Validate pallets
    if (!body.pallets || !Array.isArray(body.pallets) || body.pallets.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No pallets added to loading sheet' 
        },
        { status: 400 }
      );
    }

    // Get all pallet IDs from the request
    const palletIds = body.pallets
      .map((pallet: any) => pallet.palletId || pallet.id)
      .filter((id: string) => id);

    // Check if any pallets are already assigned to other loading sheets
    if (palletIds.length > 0) {
      const existingPallets = await prisma.cold_room_pallets.findMany({
        where: {
          id: { in: palletIds },
          loading_sheet_id: { not: null }
        },
        select: {
          id: true,
          pallet_name: true, // Changed from pallet_no to pallet_name
          loading_sheet_id: true
        }
      });

      if (existingPallets.length > 0) {
        const alreadyAssigned = existingPallets.map(p => 
          `${p.pallet_name || p.id} (assigned to sheet ${p.loading_sheet_id})`
        ).join(', ');
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Some pallets are already assigned to other loading sheets',
            details: `Pallets already assigned: ${alreadyAssigned}`,
            alreadyAssigned: existingPallets
          },
          { status: 400 }
        );
      }
    }

    // Create loading sheet with pallets in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate short ID
      const loadingSheetId = generateShortId('ls');
      console.log('Generated loading sheet ID:', loadingSheetId, 'Length:', loadingSheetId.length);
      
      // Create the loading sheet
      const loadingSheet = await tx.loading_sheets.create({
        data: {
          id: loadingSheetId,
          exporter: body.exporter,
          client: body.client || '',
          shipping_line: body.shippingLine || '',
          bill_number: body.billNumber,
          container: body.container,
          seal1: body.seal1 || '',
          seal2: body.seal2 || '',
          truck: body.truck || '',
          vessel: body.vessel || '',
          eta_msa: parseDate(body.etaMSA),
          etd_msa: parseDate(body.etdMSA),
          port: body.port || '',
          eta_port: parseDate(body.etaPort),
          temp_rec1: body.tempRec1 || '',
          temp_rec2: body.tempRec2 || '',
          loading_date: loadingDate,
          loaded_by: body.loadedBy || '',
          checked_by: body.checkedBy || '',
          remarks: body.remarks || ''
        }
      });

      console.log(`✅ Created loading sheet: ${loadingSheet.id}`);

      // Create pallet records
      const palletData = body.pallets.map((pallet: any, index: number) => {
        // Get quantity from multiple possible fields
        const quantity = Number(pallet.quantity) || 
                        Number(pallet.totalBoxes) || 
                        (pallet.boxes && Array.isArray(pallet.boxes) ? 
                          pallet.boxes.reduce((sum: number, box: any) => sum + (Number(box.quantity) || 0), 0) : 
                          0);
        
        // Generate short pallet ID
        const palletId = generateShortId('pl');
        
        // Store cold room data in available fields
        return {
          id: palletId,
          loading_sheet_id: loadingSheet.id,
          pallet_no: index + 1,
          temp: pallet.variety || '', // Store variety in temp field
          trace_code: pallet.box_type || '', // Store box_type in trace_code
          size24: quantity, // Store quantity in size24
          total: quantity, // Also store in total
          
          // Store additional cold room info if available
          cold_room_id: pallet.coldRoomId || '',
          original_pallet_id: pallet.palletId || pallet.id || '',
          variety: pallet.variety || '',
          box_type: pallet.box_type || pallet.boxType || '',
          size: pallet.size || '',
          grade: pallet.grade || '',
          quantity: quantity,
          supplier_name: pallet.supplierName || '',
          region: pallet.region || '',
          counting_record_id: pallet.countingRecordId || '',
          
          // Set other size fields to 0
          size12: 0,
          size14: 0,
          size16: 0,
          size18: 0,
          size20: 0,
          size22: 0,
          size26: 0,
          size28: 0,
          size30: 0
        };
      });

      await tx.loading_pallets.createMany({
        data: palletData
      });

      console.log(`✅ Created ${palletData.length} pallet records`);

      // Update cold room pallets to mark them as assigned
      if (palletIds.length > 0) {
        const updateResult = await tx.cold_room_pallets.updateMany({
          where: {
            id: { in: palletIds }
          },
          data: {
            loading_sheet_id: loadingSheet.id,
            last_updated: new Date() // Use last_updated instead of updated_at
          }
        });
        
        console.log(`✅ Marked ${updateResult.count} cold room pallets as assigned to loading sheet ${loadingSheet.id}`);
      }

      // Return the complete loading sheet with pallets
      const completeSheet = await tx.loading_sheets.findUnique({
        where: { id: loadingSheet.id },
        include: { 
          loading_pallets: {
            orderBy: { pallet_no: 'asc' }
          }
        }
      });

      return completeSheet;
    });

    return NextResponse.json({
      success: true,
      message: 'Loading sheet saved successfully',
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error saving loading sheet:', error);
    
    // Check for specific database errors
    let errorMessage = error.message;
    if (error.code === 'P2000') {
      errorMessage = `Database field length error. ID or field value too long. Max length is 20 characters.`;
    } else if (error.message?.includes('table') && error.message?.includes('does not exist')) {
      errorMessage = 'Database tables not set up. Please run migrations: npx prisma migrate dev';
    } else if (error.code === 'P2003') {
      errorMessage = 'Foreign key constraint failed. Please check your data.';
    } else if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      errorMessage = `Duplicate entry for ${field}. Bill number or ID must be unique.`;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save loading sheet', 
        details: errorMessage,
        code: error.code,
        suggestion: error.code === 'P2000' ? 'Try saving with shorter field values.' : undefined
      },
      { status: 500 }
    );
  }
}

// PUT: Update an existing loading sheet
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing loading sheet ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`✏️ Loading Sheets API: Updating loading sheet ${id}...`);

    // Get existing loading sheet to check current pallets
    const existingSheet = await prisma.loading_sheets.findUnique({
      where: { id },
      include: {
        loading_pallets: true
      }
    });

    if (!existingSheet) {
      return NextResponse.json(
        { success: false, error: 'Loading sheet not found' },
        { status: 404 }
      );
    }

    // Validate loading date if provided
    const loadingDate = body.loadingDate ? parseDate(body.loadingDate) : undefined;

    const updatedSheet = await prisma.$transaction(async (tx) => {
      // Update the loading sheet
      const sheet = await tx.loading_sheets.update({
        where: { id },
        data: {
          exporter: body.exporter,
          client: body.client,
          shipping_line: body.shippingLine,
          bill_number: body.billNumber,
          container: body.container,
          seal1: body.seal1,
          seal2: body.seal2,
          truck: body.truck,
          vessel: body.vessel,
          eta_msa: body.etaMSA ? parseDate(body.etaMSA) : null,
          etd_msa: body.etdMSA ? parseDate(body.etdMSA) : null,
          port: body.port,
          eta_port: body.etaPort ? parseDate(body.etaPort) : null,
          temp_rec1: body.tempRec1,
          temp_rec2: body.tempRec2,
          loading_date: loadingDate,
          loaded_by: body.loadedBy,
          checked_by: body.checkedBy,
          remarks: body.remarks
        }
      });

      // If pallets are provided, update them
      if (body.pallets && Array.isArray(body.pallets)) {
        // Get existing pallet IDs
        const existingPalletIds = existingSheet.loading_pallets.map(p => p.id);
        
        // Get new pallet IDs from request
        const newPalletIds = body.pallets
          .map((pallet: any) => pallet.palletId || pallet.id)
          .filter((id: string) => id && !existingPalletIds.includes(id));

        // Check if new pallets are already assigned to other loading sheets
        if (newPalletIds.length > 0) {
          const existingPallets = await tx.cold_room_pallets.findMany({
            where: {
              id: { in: newPalletIds },
              loading_sheet_id: { not: null, not: id }
            },
            select: {
              id: true,
              pallet_no: true,
              loading_sheet_id: true
            }
          });

          if (existingPallets.length > 0) {
            const alreadyAssigned = existingPallets.map(p => 
              `${p.pallet_no || p.id} (assigned to sheet ${p.loading_sheet_id})`
            ).join(', ');
            
            throw new Error(`Some pallets are already assigned to other loading sheets: ${alreadyAssigned}`);
          }
        }

        // Delete existing pallets
        await tx.loading_pallets.deleteMany({
          where: { loading_sheet_id: id }
        });

        // Clear loading_sheet_id from previously assigned pallets
        await tx.cold_room_pallets.updateMany({
          where: {
            loading_sheet_id: id
          },
          data: {
            loading_sheet_id: null,
            updated_at: new Date()
          }
        });

        // Create new pallets
        if (body.pallets.length > 0) {
          const palletData = body.pallets.map((pallet: any, index: number) => {
            // Get quantity from multiple possible fields
            const quantity = Number(pallet.quantity) || 
                            Number(pallet.totalBoxes) || 
                            (pallet.boxes && Array.isArray(pallet.boxes) ? 
                              pallet.boxes.reduce((sum: number, box: any) => sum + (Number(box.quantity) || 0), 0) : 
                              0);
            
            // Generate short pallet ID
            const palletId = generateShortId('pl');
            
            return {
              id: palletId,
              loading_sheet_id: id,
              pallet_no: pallet.palletNo || index + 1,
              temp: pallet.variety || '', // Store variety in temp field
              trace_code: pallet.box_type || '', // Store box_type in trace_code
              size24: quantity, // Store quantity in size24
              total: quantity, // Also store in total
              
              // Set other size fields to 0
              size12: 0,
              size14: 0,
              size16: 0,
              size18: 0,
              size20: 0,
              size22: 0,
              size26: 0,
              size28: 0,
              size30: 0
            };
          });

          await tx.loading_pallets.createMany({
            data: palletData
          });

          console.log(`✅ Updated ${palletData.length} pallet records`);

          // Update cold room pallets to mark them as assigned
          const newPalletIds = body.pallets
            .map((pallet: any) => pallet.palletId || pallet.id)
            .filter((id: string) => id);
            
          if (newPalletIds.length > 0) {
            const updateResult = await tx.cold_room_pallets.updateMany({
              where: {
                id: { in: newPalletIds }
              },
              data: {
                loading_sheet_id: id,
                updated_at: new Date()
              }
            });
            
            console.log(`✅ Marked ${updateResult.count} cold room pallets as assigned to loading sheet ${id}`);
          }
        }
      }

      // Return the complete updated sheet
      const completeSheet = await tx.loading_sheets.findUnique({
        where: { id },
        include: { 
          loading_pallets: {
            orderBy: { pallet_no: 'asc' }
          }
        }
      });

      return completeSheet;
    });

    return NextResponse.json({
      success: true,
      message: 'Loading sheet updated successfully',
      data: updatedSheet
    });

  } catch (error: any) {
    console.error('❌ Error updating loading sheet:', error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.code === 'P2025') {
      errorMessage = 'Loading sheet not found';
      statusCode = 404;
    } else if (error.message.includes('already assigned to other loading sheets')) {
      errorMessage = error.message;
      statusCode = 400;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update loading sheet', 
        details: errorMessage,
        code: error.code
      },
      { status: statusCode }
    );
  }
}

// DELETE: Remove a loading sheet
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing loading sheet ID' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Loading Sheets API: Deleting loading sheet ${id}...`);

    const deletedSheet = await prisma.$transaction(async (tx) => {
      // Clear loading_sheet_id from assigned cold room pallets
      await tx.cold_room_pallets.updateMany({
        where: {
          loading_sheet_id: id
        },
        data: {
          loading_sheet_id: null,
          updated_at: new Date()
        }
      });

      // Delete the loading sheet (this will cascade to loading_pallets)
      const sheet = await tx.loading_sheets.delete({
        where: { id }
      });

      return sheet;
    });

    return NextResponse.json({
      success: true,
      message: 'Loading sheet deleted successfully',
      data: deletedSheet
    });

  } catch (error: any) {
    console.error('❌ Error deleting loading sheet:', error);
    
    let errorMessage = error.message;
    if (error.code === 'P2025') {
      errorMessage = 'Loading sheet not found';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete loading sheet', 
        details: errorMessage,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// PATCH: Update carrier assignment for a loading sheet
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing loading sheet ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`🚚 Loading Sheets API: Updating carrier assignment for sheet ${id}...`);

    // Check if loading sheet exists
    const existingSheet = await prisma.loading_sheets.findUnique({
      where: { id }
    });

    if (!existingSheet) {
      return NextResponse.json(
        { success: false, error: 'Loading sheet not found' },
        { status: 404 }
      );
    }

    // Validate carrier if provided
    if (body.assignedCarrierId) {
      const carrier = await prisma.carriers.findUnique({
        where: { id: body.assignedCarrierId }
      });

      if (!carrier) {
        return NextResponse.json(
          { success: false, error: 'Carrier not found' },
          { status: 404 }
        );
      }
    }

    // Update the loading sheet
    const updatedSheet = await prisma.loading_sheets.update({
      where: { id },
      data: {
        assigned_carrier_id: body.assignedCarrierId || null
      },
      include: {
        loading_pallets: {
          orderBy: { pallet_no: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Carrier assignment updated successfully',
      data: updatedSheet
    });

  } catch (error: any) {
    console.error('❌ Error updating carrier assignment:', error);
    
    let errorMessage = error.message;
    if (error.code === 'P2025') {
      errorMessage = 'Loading sheet not found';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update carrier assignment', 
        details: errorMessage,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// GET: Download loading sheet as CSV
export async function GET_DOWNLOAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing loading sheet ID' },
        { status: 400 }
      );
    }

    console.log(`📥 Loading Sheets API: Downloading loading sheet ${id} as CSV...`);

    // Fetch loading sheet with pallets
    const loadingSheet = await prisma.loading_sheets.findUnique({
      where: { id },
      include: {
        loading_pallets: {
          orderBy: { pallet_no: 'asc' }
        }
      }
    });

    if (!loadingSheet) {
      return NextResponse.json(
        { success: false, error: 'Loading sheet not found' },
        { status: 404 }
      );
    }

    // Format date for CSV
    const formatDateForCSV = (date: Date | null) => {
      if (!date) return '';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    // Generate CSV content
    const headers = ['LOADING SHEET\n\n'];
    
    // Header information
    headers.push(`EXPORTER,${loadingSheet.exporter || ''},LOADING DATE,${formatDateForCSV(loadingSheet.loading_date)}`);
    headers.push(`CLIENT,${loadingSheet.client || ''},VESSEL,${loadingSheet.vessel || ''}`);
    headers.push(`SHIPPING LINE,${loadingSheet.shipping_line || ''},ETA MSA,${formatDateForCSV(loadingSheet.eta_msa)}`);
    headers.push(`BILL NUMBER,${loadingSheet.bill_number || ''},ETD MSA,${formatDateForCSV(loadingSheet.etd_msa)}`);
    headers.push(`CONTAINER,${loadingSheet.container || ''},PORT,${loadingSheet.port || ''}`);
    headers.push(`SEAL 1,${loadingSheet.seal1 || ''},ETA PORT,${formatDateForCSV(loadingSheet.eta_port)}`);
    headers.push(`SEAL 2,${loadingSheet.seal2 || ''},TEMP REC 1,${loadingSheet.temp_rec1 || ''}`);
    headers.push(`TRUCK,${loadingSheet.truck || ''},TEMP REC 2,${loadingSheet.temp_rec2 || ''}\n`);
    
    // Pallet headers
    const tableHeaders = ['PALLET NO', 'VARIETY', 'BOX TYPE', 'QUANTITY', 'WEIGHT (kg)'];
    headers.push(tableHeaders.join(','));
    
    // Pallet rows
    const rows = loadingSheet.loading_pallets.map((pallet) => {
      const quantity = pallet.size24 || 0;
      const boxType = pallet.trace_code || '';
      const weight = quantity * (boxType === '10kg' ? 10 : 4);
      
      return [
        pallet.pallet_no,
        pallet.temp || 'N/A',
        boxType,
        quantity,
        weight
      ].join(',');
    });
    
    headers.push(...rows);
    
    // Totals
    const totals = loadingSheet.loading_pallets.reduce(
      (acc, pallet) => {
        const quantity = pallet.size24 || 0;
        const boxType = pallet.trace_code || '';
        const weight = quantity * (boxType === '10kg' ? 10 : 4);
        
        acc.totalBoxes += quantity;
        acc.totalWeight += weight;
        acc.totalPallets += 1;
        return acc;
      },
      { totalBoxes: 0, totalWeight: 0, totalPallets: 0 }
    );
    
    headers.push(`\nSUMMARY`);
    headers.push(`Total Pallets,${totals.totalPallets}`);
    headers.push(`Total Boxes,${totals.totalBoxes}`);
    headers.push(`Total Weight,${totals.totalWeight} kg\n`);
    
    // Loading details
    headers.push('LOADING DETAILS');
    headers.push(`Loaded by,${loadingSheet.loaded_by || ''}`);
    headers.push(`Checked by,${loadingSheet.checked_by || ''}`);
    headers.push(`Remarks,${loadingSheet.remarks || ''}`);
    
    const csvContent = headers.join('\n');
    
    // Return as CSV download
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="loading-sheet-${loadingSheet.bill_number || loadingSheet.id}.csv"`
      }
    });

  } catch (error: any) {
    console.error('❌ Error downloading loading sheet:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to download loading sheet', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: Mark pallets as assigned (separate endpoint for frontend)
// POST: Mark pallets as assigned (separate endpoint for frontend)
export async function POST_ASSIGN_PALLETS(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔒 Loading Sheets API: Marking pallets as assigned...', {
      palletCount: body.palletIds?.length || 0,
      loadingSheetId: body.loadingSheetId
    });

    // Validate required fields
    if (!body.palletIds || !Array.isArray(body.palletIds) || body.palletIds.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No pallet IDs provided' 
        },
        { status: 400 }
      );
    }

    if (!body.loadingSheetId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing loading sheet ID' 
        },
        { status: 400 }
      );
    }

    // Check if loading sheet exists
    const loadingSheet = await prisma.loading_sheets.findUnique({
      where: { id: body.loadingSheetId }
    });

    if (!loadingSheet) {
      return NextResponse.json(
        { success: false, error: 'Loading sheet not found' },
        { status: 404 }
      );
    }

    // Check if any pallets are already assigned to other loading sheets
    const existingPallets = await prisma.cold_room_pallets.findMany({
      where: {
        id: { in: body.palletIds },
        loading_sheet_id: { not: null, not: body.loadingSheetId }
      },
      select: {
        id: true,
        pallet_name: true, // Changed from pallet_no to pallet_name
        loading_sheet_id: true
      }
    });

    if (existingPallets.length > 0) {
      const alreadyAssigned = existingPallets.map(p => 
        `${p.pallet_name || p.id} (assigned to sheet ${p.loading_sheet_id})`
      ).join(', ');
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Some pallets are already assigned to other loading sheets',
          details: `Pallets already assigned: ${alreadyAssigned}`,
          alreadyAssigned: existingPallets
        },
        { status: 400 }
      );
    }

    // Update pallets to mark them as assigned
    const updateResult = await prisma.cold_room_pallets.updateMany({
      where: {
        id: { in: body.palletIds }
      },
      data: {
        loading_sheet_id: body.loadingSheetId,
        last_updated: new Date() // Use last_updated instead of updated_at
      }
    });

    console.log(`✅ Marked ${updateResult.count} pallets as assigned to loading sheet ${body.loadingSheetId}`);

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} pallets marked as assigned successfully`,
      data: {
        updatedCount: updateResult.count,
        loadingSheetId: body.loadingSheetId
      }
    });

  } catch (error: any) {
    console.error('❌ Error marking pallets as assigned:', error);
    
    let errorMessage = error.message;
    if (error.code === 'P2003') {
      errorMessage = 'Invalid pallet ID or loading sheet ID';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to mark pallets as assigned', 
        details: errorMessage,
        code: error.code
      },
      { status: 500 }
    );
  }
}