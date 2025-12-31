// src/app/api/counting/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET endpoint to fetch counting records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('📡 GET /api/counting?action=', action);
    
    if (action === 'history') {
      // Handle history GET request - get completed records
      const search = searchParams.get('search') || '';
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      let query = `SELECT * FROM rejection_records WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (supplier_name LIKE ? OR pallet_id LIKE ? OR region LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (startDate) {
        query += ` AND DATE(submitted_at) >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND DATE(submitted_at) <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY submitted_at DESC LIMIT 100`;

      const filteredRecords = await prisma.$queryRawUnsafe(query, ...params);
      
      return NextResponse.json({
        success: true,
        data: filteredRecords || []
      });
      
    } else if (action === 'stats') {
      // Handle stats GET request
      try {
        // Get counting records stats
        const [countingStats, rejectionStats] = await Promise.all([
          prisma.$queryRaw`SELECT COUNT(*) as total FROM counting_records WHERE status = 'pending'`,
          prisma.$queryRaw`SELECT COUNT(*) as total FROM rejection_records`,
        ]);

        // Get box totals from individual columns
        const boxTotals = await prisma.$queryRaw`
          SELECT 
            SUM(fuerte_4kg_total) as fuerte_4kg,
            SUM(fuerte_10kg_total) as fuerte_10kg,
            SUM(hass_4kg_total) as hass_4kg,
            SUM(hass_10kg_total) as hass_10kg
          FROM counting_records
        `;

        // Get recent activity (last 7 and 30 days)
        const recentActivity = await prisma.$queryRaw`
          SELECT 
            COUNT(CASE WHEN DATE(submitted_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
            COUNT(CASE WHEN DATE(submitted_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
          FROM rejection_records
        `;

        // Get unique suppliers
        const uniqueSuppliers = await prisma.$queryRaw`
          SELECT COUNT(DISTINCT supplier_id) as total FROM counting_records
        `;

        const stats = {
          total_processed: Array.isArray(rejectionStats) && rejectionStats[0]?.total ? parseInt(rejectionStats[0].total) : 0,
          pending_rejections: Array.isArray(countingStats) && countingStats[0]?.total ? parseInt(countingStats[0].total) : 0,
          total_suppliers: Array.isArray(uniqueSuppliers) && uniqueSuppliers[0]?.total ? parseInt(uniqueSuppliers[0].total) : 0,
          fuerte_4kg: Array.isArray(boxTotals) && boxTotals[0]?.fuerte_4kg ? parseInt(boxTotals[0].fuerte_4kg) : 0,
          fuerte_10kg: Array.isArray(boxTotals) && boxTotals[0]?.fuerte_10kg ? parseInt(boxTotals[0].fuerte_10kg) : 0,
          hass_4kg: Array.isArray(boxTotals) && boxTotals[0]?.hass_4kg ? parseInt(boxTotals[0].hass_4kg) : 0,
          hass_10kg: Array.isArray(boxTotals) && boxTotals[0]?.hass_10kg ? parseInt(boxTotals[0].hass_10kg) : 0,
          recent_activity: {
            last_7_days: Array.isArray(recentActivity) && recentActivity[0]?.last_7_days ? parseInt(recentActivity[0].last_7_days) : 0,
            last_30_days: Array.isArray(recentActivity) && recentActivity[0]?.last_30_days ? parseInt(recentActivity[0].last_30_days) : 0,
          }
        };

        return NextResponse.json({
          success: true,
          data: stats
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({
          success: true,
          data: {
            total_processed: 0,
            pending_rejections: 0,
            total_suppliers: 0,
            fuerte_4kg: 0,
            fuerte_10kg: 0,
            hass_4kg: 0,
            hass_10kg: 0,
            recent_activity: {
              last_7_days: 0,
              last_30_days: 0,
            }
          }
        });
      }
      
    } else if (action === 'pending') {
      // Get counting records that are pending for rejection
      try {
        const pendingRecords = await prisma.$queryRaw`
          SELECT * FROM counting_records 
          WHERE status = 'pending'
          ORDER BY submitted_at DESC
          LIMIT 50
        `;
        
        return NextResponse.json({
          success: true,
          data: pendingRecords || []
        });
      } catch (error) {
        console.error('Error fetching pending records:', error);
        return NextResponse.json({
          success: true,
          data: []
        });
      }
      
    } else if (action === 'coldroom') {
      // Get ALL counting records - NO STATUS FILTER
      try {
        console.log('📦 Getting ALL counting records (no status filter)...');
        
        const allCountingRecords = await prisma.$queryRaw`
          SELECT * FROM counting_records 
          ORDER BY submitted_at DESC
          LIMIT 100
        `;
        
        console.log(`✅ Found ${Array.isArray(allCountingRecords) ? allCountingRecords.length : 0} counting records`);
        
        // Log the status of each record
        if (Array.isArray(allCountingRecords) && allCountingRecords.length > 0) {
          allCountingRecords.forEach((record: any, index: number) => {
            console.log(`   Record ${index + 1}: ${record.supplier_name}, status: ${record.status}, for_coldroom: ${record.for_coldroom}`);
          });
        }
        
        // Process the data to ensure counting_data and totals are properly parsed
        const processedRecords = Array.isArray(allCountingRecords) ? allCountingRecords.map((record: any) => {
          // Parse counting_data if it's a string
          let countingData = record.counting_data;
          if (typeof countingData === 'string') {
            try {
              countingData = JSON.parse(countingData);
            } catch (e) {
              console.error('Error parsing counting_data:', e);
              countingData = {};
            }
          }
          
          // Parse totals if it's a string
          let totals = record.totals;
          if (typeof totals === 'string') {
            try {
              totals = JSON.parse(totals);
            } catch (e) {
              console.error('Error parsing totals:', e);
              totals = {};
            }
          }
          
          return {
            ...record,
            counting_data: countingData,
            totals: totals
          };
        }) : [];
        
        return NextResponse.json({
          success: true,
          data: processedRecords || []
        });
      } catch (error) {
        console.error('Error fetching counting records:', error);
        return NextResponse.json({
          success: true,
          data: []
        });
      }
      
    } else {
      // Return all counting records (default endpoint)
      try {
        const countingRecords = await prisma.$queryRaw`
          SELECT * FROM counting_records 
          ORDER BY submitted_at DESC
          LIMIT 50
        `;
        
        // Process the data
        const processedRecords = Array.isArray(countingRecords) ? countingRecords.map((record: any) => {
          let countingData = record.counting_data;
          if (typeof countingData === 'string') {
            try {
              countingData = JSON.parse(countingData);
            } catch (e) {
              countingData = {};
            }
          }
          
          let totals = record.totals;
          if (typeof totals === 'string') {
            try {
              totals = JSON.parse(totals);
            } catch (e) {
              totals = {};
            }
          }
          
          return {
            ...record,
            counting_data: countingData,
            totals: totals
          };
        }) : [];
        
        return NextResponse.json({
          success: true,
          data: processedRecords || []
        });
      } catch (error) {
        console.error('Error fetching counting records:', error);
        return NextResponse.json({
          success: true,
          data: []
        });
      }
    }
    
  } catch (error: any) {
    console.error('❌ GET /api/counting Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch counting data: ' + error.message
    }, { status: 500 });
  }
}

// POST endpoint to save counting data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('📨 POST /api/counting - Saving counting data:', {
      supplier_name: data.supplier_name,
      supplier_id: data.supplier_id,
      pallet_id: data.pallet_id,
      total_weight: data.total_weight
    });

    // Validate required fields
    if (!data.supplier_id || !data.supplier_name || !data.pallet_id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: supplier_id, supplier_name, or pallet_id' 
        },
        { status: 400 }
      );
    }

    // Check if supplier already exists in counting records with pending status
    const existing = await prisma.$queryRaw`
      SELECT id FROM counting_records 
      WHERE supplier_id = ${data.supplier_id} 
      AND status IN ('pending', 'pending_coldroom', 'pending_rejection')
    `;
    
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'This supplier already has a pending counting record'
        },
        { status: 400 }
      );
    }

    // Generate ID
    const id = `CR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Helper function to calculate totals from counting form data
    const calculateTotals = (countingData: any) => {
      const sumByPrefix = (prefix: string, boxType: '4kg' | '10kg', classType: 'class1' | 'class2') => {
        const sizes = boxType === '4kg' 
          ? ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26']
          : ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26', 'size28', 'size30', 'size32'];
        
        return sizes.reduce((total, size) => {
          const fieldName = `${prefix}_${boxType}_${classType}_${size}`;
          const value = countingData[fieldName] || 0;
          return total + (typeof value === 'number' ? value : parseFloat(value) || 0);
        }, 0);
      };

      const fuerte_4kg_class1 = sumByPrefix('fuerte', '4kg', 'class1');
      const fuerte_4kg_class2 = sumByPrefix('fuerte', '4kg', 'class2');
      const fuerte_4kg_total = fuerte_4kg_class1 + fuerte_4kg_class2;
      
      const fuerte_10kg_class1 = sumByPrefix('fuerte', '10kg', 'class1');
      const fuerte_10kg_class2 = sumByPrefix('fuerte', '10kg', 'class2');
      const fuerte_10kg_total = fuerte_10kg_class1 + fuerte_10kg_class2;
      
      const hass_4kg_class1 = sumByPrefix('hass', '4kg', 'class1');
      const hass_4kg_class2 = sumByPrefix('hass', '4kg', 'class2');
      const hass_4kg_total = hass_4kg_class1 + hass_4kg_class2;
      
      const hass_10kg_class1 = sumByPrefix('hass', '10kg', 'class1');
      const hass_10kg_class2 = sumByPrefix('hass', '10kg', 'class2');
      const hass_10kg_total = hass_10kg_class1 + hass_10kg_class2;

      return {
        fuerte_4kg_class1,
        fuerte_4kg_class2,
        fuerte_4kg_total,
        fuerte_10kg_class1,
        fuerte_10kg_class2,
        fuerte_10kg_total,
        hass_4kg_class1,
        hass_4kg_class2,
        hass_4kg_total,
        hass_10kg_class1,
        hass_10kg_class2,
        hass_10kg_total
      };
    };

    // Calculate totals - use either provided totals or calculate from counting_data
    const totals = data.totals || calculateTotals(data.counting_data || {});

    // Calculate total counted weight
    const calculateTotalWeight = (totals: any) => {
      const fuerte4kgWeight = (totals?.fuerte_4kg_total || 0) * 4;
      const fuerte10kgWeight = (totals?.fuerte_10kg_total || 0) * 10;
      const hass4kgWeight = (totals?.hass_4kg_total || 0) * 4;
      const hass10kgWeight = (totals?.hass_10kg_total || 0) * 10;
      return fuerte4kgWeight + fuerte10kgWeight + hass4kgWeight + hass10kgWeight;
    };

    const total_counted_weight = data.total_counted_weight || calculateTotalWeight(totals);

    // Determine status: Use 'pending' for variance tab
    const status = 'pending';
    const for_coldroom = data.for_coldroom !== undefined ? data.for_coldroom : false;
    
    // Ensure counting_data includes fruits array
    const countingDataWithFruits = {
      ...(data.counting_data || {}),
      fruits: data.fruits || [],
      for_coldroom: for_coldroom
    };

    // Save to database - Using total_weight
    console.log('💾 Saving to counting_records table...');

    await prisma.$executeRaw`
      INSERT INTO counting_records (
        id,
        supplier_id,
        supplier_name,
        supplier_phone,
        region,
        pallet_id,
        total_weight,
        total_counted_weight,
        
        fuerte_4kg_class1,
        fuerte_4kg_class2,
        fuerte_4kg_total,
        fuerte_10kg_class1,
        fuerte_10kg_class2,
        fuerte_10kg_total,
        hass_4kg_class1,
        hass_4kg_class2,
        hass_4kg_total,
        hass_10kg_class1,
        hass_10kg_class2,
        hass_10kg_total,
        
        counting_data,
        totals,
        status,
        for_coldroom,
        submitted_at,
        processed_by,
        notes
      ) VALUES (
        ${id},
        ${data.supplier_id},
        ${data.supplier_name},
        ${data.supplier_phone || ''},
        ${data.region || ''},
        ${data.pallet_id},
        ${data.total_weight || 0},
        ${total_counted_weight},
        
        ${totals.fuerte_4kg_class1 || 0},
        ${totals.fuerte_4kg_class2 || 0},
        ${totals.fuerte_4kg_total || 0},
        ${totals.fuerte_10kg_class1 || 0},
        ${totals.fuerte_10kg_class2 || 0},
        ${totals.fuerte_10kg_total || 0},
        ${totals.hass_4kg_class1 || 0},
        ${totals.hass_4kg_class2 || 0},
        ${totals.hass_4kg_total || 0},
        ${totals.hass_10kg_class1 || 0},
        ${totals.hass_10kg_class2 || 0},
        ${totals.hass_10kg_total || 0},
        
        ${JSON.stringify(countingDataWithFruits)},
        ${JSON.stringify(totals)},
        ${status},
        ${for_coldroom},
        NOW(),
        ${data.processed_by || 'Warehouse Staff'},
        ${data.notes || ''}
      )
    `;

    // Fetch the newly created record to return
    const savedRecordResult = await prisma.$queryRaw`
      SELECT * FROM counting_records WHERE id = ${id}
    `;

    const savedRecord = Array.isArray(savedRecordResult) ? savedRecordResult[0] : null;

    if (!savedRecord) {
      throw new Error('Failed to retrieve saved counting record');
    }

    console.log(`✅ Counting record saved: ${data.supplier_name} with ID: ${id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: savedRecord.id,
        supplier_id: savedRecord.supplier_id,
        supplier_name: savedRecord.supplier_name,
        supplier_phone: savedRecord.supplier_phone,
        region: savedRecord.region,
        pallet_id: savedRecord.pallet_id,
        
        total_weight: savedRecord.total_weight,
        total_counted_weight: savedRecord.total_counted_weight,
        
        fuerte_4kg_class1: savedRecord.fuerte_4kg_class1 || 0,
        fuerte_4kg_class2: savedRecord.fuerte_4kg_class2 || 0,
        fuerte_4kg_total: savedRecord.fuerte_4kg_total || 0,
        fuerte_10kg_class1: savedRecord.fuerte_10kg_class1 || 0,
        fuerte_10kg_class2: savedRecord.fuerte_10kg_class2 || 0,
        fuerte_10kg_total: savedRecord.fuerte_10kg_total || 0,
        hass_4kg_class1: savedRecord.hass_4kg_class1 || 0,
        hass_4kg_class2: savedRecord.hass_4kg_class2 || 0,
        hass_4kg_total: savedRecord.hass_4kg_total || 0,
        hass_10kg_class1: savedRecord.hass_10kg_class1 || 0,
        hass_10kg_class2: savedRecord.hass_10kg_class2 || 0,
        hass_10kg_total: savedRecord.hass_10kg_total || 0,
        
        counting_data: savedRecord.counting_data,
        totals: savedRecord.totals,
        status: savedRecord.status,
        for_coldroom: savedRecord.for_coldroom,
        submitted_at: savedRecord.submitted_at,
        processed_by: savedRecord.processed_by,
        notes: savedRecord.notes
      },
      message: 'Counting data saved successfully to database'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ POST /api/counting Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save counting record: ' + error.message
    }, { status: 500 });
  }
}

// PUT endpoint to move counting record to rejection (complete the process)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('🔄 PUT /api/counting - Moving to rejection');

    // Validate required fields
    if (!data.counting_record_id || !data.rejection_data) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: counting_record_id or rejection_data' 
        },
        { status: 400 }
      );
    }

    // Find the counting record
    const countingRecords = await prisma.$queryRaw`
      SELECT * FROM counting_records WHERE id = ${data.counting_record_id}
    `;
    
    if (!Array.isArray(countingRecords) || countingRecords.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Counting record not found' 
        },
        { status: 404 }
      );
    }

    const countingRecord = countingRecords[0];

    // Calculate weight variance
    const totalRejectedWeight = data.rejection_data.crates?.reduce(
      (sum: number, crate: any) => sum + (crate.total_weight || 0), 0
    ) || 0;
    
    const weightVariance = countingRecord.total_weight - 
      (countingRecord.total_counted_weight + totalRejectedWeight);
    
    const determineVarianceLevel = (variance: number): 'low' | 'medium' | 'high' => {
      const absVariance = Math.abs(variance);
      if (absVariance < 10) return 'low';
      if (absVariance <= 20) return 'medium';
      return 'high';
    };

    // Create rejection record ID
    const rejectionId = `REJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save to rejection_records table
    await prisma.$executeRaw`
      INSERT INTO rejection_records (
        id,
        supplier_id,
        supplier_name,
        pallet_id,
        region,
        total_intake_weight,
        total_counted_weight,
        total_rejected_weight,
        weight_variance,
        variance_level,
        crates,
        notes,
        counting_data,
        counting_totals,
        submitted_at,
        processed_by,
        original_counting_id
      ) VALUES (
        ${rejectionId},
        ${countingRecord.supplier_id},
        ${countingRecord.supplier_name},
        ${countingRecord.pallet_id},
        ${countingRecord.region},
        ${countingRecord.total_weight},
        ${countingRecord.total_counted_weight},
        ${totalRejectedWeight},
        ${weightVariance},
        ${determineVarianceLevel(weightVariance)},
        ${JSON.stringify(data.rejection_data.crates || [])},
        ${data.rejection_data.notes || ''},
        ${JSON.stringify(countingRecord.counting_data || {})},
        ${JSON.stringify(countingRecord.totals || {})},
        NOW(),
        ${data.rejection_data.processed_by || 'Warehouse Staff'},
        ${countingRecord.id}
      )
    `;

    // Delete from counting_records
    await prisma.$executeRaw`
      DELETE FROM counting_records WHERE id = ${data.counting_record_id}
    `;

    console.log(`✅ Moved to rejection: ${countingRecord.supplier_name}`);

    return NextResponse.json({
      success: true,
      data: {
        id: rejectionId,
        supplier_id: countingRecord.supplier_id,
        supplier_name: countingRecord.supplier_name,
        pallet_id: countingRecord.pallet_id,
        region: countingRecord.region,
        total_intake_weight: countingRecord.total_weight,
        total_counted_weight: countingRecord.total_counted_weight,
        total_rejected_weight: totalRejectedWeight,
        weight_variance: weightVariance,
        variance_level: determineVarianceLevel(weightVariance),
        crates: data.rejection_data.crates || [],
        notes: data.rejection_data.notes || '',
        counting_data: countingRecord.counting_data,
        counting_totals: countingRecord.totals,
        submitted_at: new Date().toISOString(),
        processed_by: data.rejection_data.processed_by || 'Warehouse Staff',
        original_counting_id: countingRecord.id
      },
      message: 'Supplier successfully moved to history'
    });

  } catch (error: any) {
    console.error('❌ PUT /api/counting Error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process rejection: ' + error.message
      },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update counting record status (for cold room)
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('🔄 PATCH /api/counting - Updating counting record');

    // Validate required fields
    if (!data.id || !data.status) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: id or status' 
        },
        { status: 400 }
      );
    }

    // Update the counting record status
    const result = await prisma.$executeRaw`
      UPDATE counting_records 
      SET status = ${data.status},
          for_coldroom = ${data.for_coldroom !== undefined ? data.for_coldroom : false}
      WHERE id = ${data.id}
    `;

    // Check if any row was updated
    if (typeof result === 'object' && 'affectedRows' in result && result.affectedRows === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Counting record not found' 
        },
        { status: 404 }
      );
    }

    console.log(`✅ Updated counting record: ${data.id} to status: ${data.status}`);

    return NextResponse.json({
      success: true,
      message: 'Counting record updated successfully'
    });

  } catch (error: any) {
    console.error('❌ PATCH /api/counting Error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update counting record: ' + error.message
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a counting record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing record ID' 
        },
        { status: 400 }
      );
    }

    // Delete from counting_records
    const result = await prisma.$executeRaw`
      DELETE FROM counting_records WHERE id = ${id}
    `;

    // Check if any row was deleted
    if (typeof result === 'object' && 'affectedRows' in result && result.affectedRows === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Record not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Counting record deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ DELETE /api/counting Error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete counting record: ' + error.message
      },
      { status: 500 }
    );
  }
}