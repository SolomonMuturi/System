// src/app/api/cold-room/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    console.log('GET /api/cold-room - Action:', action);

    if (action === 'boxes') {
      try {
        const boxes = await prisma.$queryRaw`
          SELECT 
            id,
            variety,
            box_type as boxType,
            size,
            grade,
            quantity,
            cold_room_id as cold_room_id,
            supplier_name,
            pallet_id,
            region,
            created_at
          FROM cold_room_boxes 
          ORDER BY created_at DESC
        `;
        
        console.log('📦 Retrieved boxes:', Array.isArray(boxes) ? boxes.length : 0);
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(boxes) ? boxes : [] 
        });
      } catch (error) {
        console.error('Error fetching boxes:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'pallets') {
      try {
        const pallets = await prisma.$queryRaw`
          SELECT 
            id,
            variety,
            box_type as boxType,
            size,
            grade,
            pallet_count as pallet_count,
            cold_room_id as cold_room_id,
            created_at,
            last_updated
          FROM cold_room_pallets 
          ORDER BY created_at DESC
        `;
        
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(pallets) ? pallets : [] 
        });
      } catch (error) {
        console.error('Error fetching pallets:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'temperature') {
      try {
        const logs = await prisma.$queryRaw`
          SELECT * FROM temperature_logs ORDER BY timestamp DESC LIMIT 50
        `;
        
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(logs) ? logs : [] 
        });
      } catch (error) {
        console.error('Error fetching temperature logs:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'repacking') {
      try {
        const records = await prisma.$queryRaw`
          SELECT * FROM repacking_records ORDER BY timestamp DESC LIMIT 50
        `;
        
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(records) ? records : [] 
        });
      } catch (error) {
        console.error('Error fetching repacking records:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'stats') {
      try {
        console.log('📊 Fetching cold room statistics...');
        
        // Get overall stats
        const overallStatsResult = await prisma.$queryRaw`
          SELECT 
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN quantity ELSE 0 END), 0) as total4kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN quantity ELSE 0 END), 0) as total10kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN FLOOR(quantity / 288) ELSE 0 END), 0) as total4kgPallets,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN FLOOR(quantity / 120) ELSE 0 END), 0) as total10kgPallets,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass210kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass210kg
          FROM cold_room_boxes
        `;

        // Get stats for coldroom1
        const coldroom1StatsResult = await prisma.$queryRaw`
          SELECT 
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN quantity ELSE 0 END), 0) as total4kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN quantity ELSE 0 END), 0) as total10kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN FLOOR(quantity / 288) ELSE 0 END), 0) as total4kgPallets,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN FLOOR(quantity / 120) ELSE 0 END), 0) as total10kgPallets,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass210kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass210kg
          FROM cold_room_boxes 
          WHERE cold_room_id = 'coldroom1'
        `;

        // Get stats for coldroom2
        const coldroom2StatsResult = await prisma.$queryRaw`
          SELECT 
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN quantity ELSE 0 END), 0) as total4kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN quantity ELSE 0 END), 0) as total10kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN FLOOR(quantity / 288) ELSE 0 END), 0) as total4kgPallets,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN FLOOR(quantity / 120) ELSE 0 END), 0) as total10kgPallets,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass210kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass210kg
          FROM cold_room_boxes 
          WHERE cold_room_id = 'coldroom2'
        `;

        // Get last temperature logs
        const lastTemperatureLogsResult = await prisma.$queryRaw`
          SELECT * FROM temperature_logs ORDER BY timestamp DESC LIMIT 10
        `;

        // Get recent repacking
        const recentRepackingResult = await prisma.$queryRaw`
          SELECT * FROM repacking_records ORDER BY timestamp DESC LIMIT 5
        `;

        // Format the data
        const overallStats = Array.isArray(overallStatsResult) && overallStatsResult.length > 0 
          ? overallStatsResult[0] 
          : {
              total4kgBoxes: 0,
              total10kgBoxes: 0,
              total4kgPallets: 0,
              total10kgPallets: 0,
              fuerteClass14kg: 0,
              fuerteClass24kg: 0,
              fuerteClass110kg: 0,
              fuerteClass210kg: 0,
              hassClass14kg: 0,
              hassClass24kg: 0,
              hassClass110kg: 0,
              hassClass210kg: 0
            };

        const coldroom1Stats = Array.isArray(coldroom1StatsResult) && coldroom1StatsResult.length > 0 
          ? coldroom1StatsResult[0] 
          : {
              total4kgBoxes: 0,
              total10kgBoxes: 0,
              total4kgPallets: 0,
              total10kgPallets: 0,
              fuerteClass14kg: 0,
              fuerteClass24kg: 0,
              fuerteClass110kg: 0,
              fuerteClass210kg: 0,
              hassClass14kg: 0,
              hassClass24kg: 0,
              hassClass110kg: 0,
              hassClass210kg: 0
            };

        const coldroom2Stats = Array.isArray(coldroom2StatsResult) && coldroom2StatsResult.length > 0 
          ? coldroom2StatsResult[0] 
          : {
              total4kgBoxes: 0,
              total10kgBoxes: 0,
              total4kgPallets: 0,
              total10kgPallets: 0,
              fuerteClass14kg: 0,
              fuerteClass24kg: 0,
              fuerteClass110kg: 0,
              fuerteClass210kg: 0,
              hassClass14kg: 0,
              hassClass24kg: 0,
              hassClass110kg: 0,
              hassClass210kg: 0
            };

        const lastTemperatureLogs = Array.isArray(lastTemperatureLogsResult) 
          ? lastTemperatureLogsResult 
          : [];

        const recentRepacking = Array.isArray(recentRepackingResult) 
          ? recentRepackingResult 
          : [];

        console.log('📊 Statistics loaded:', {
          overall: overallStats,
          coldroom1: coldroom1Stats,
          coldroom2: coldroom2Stats
        });

        return NextResponse.json({
          success: true,
          data: {
            overall: overallStats,
            coldroom1: coldroom1Stats,
            coldroom2: coldroom2Stats,
            lastTemperatureLogs: lastTemperatureLogs,
            recentRepacking: recentRepacking
          }
        });

      } catch (error) {
        console.error('Error fetching cold room stats:', error);
        // Return default stats structure
        const defaultStats = {
          total4kgBoxes: 0,
          total10kgBoxes: 0,
          total4kgPallets: 0,
          total10kgPallets: 0,
          fuerteClass14kg: 0,
          fuerteClass24kg: 0,
          fuerteClass110kg: 0,
          fuerteClass210kg: 0,
          hassClass14kg: 0,
          hassClass24kg: 0,
          hassClass110kg: 0,
          hassClass210kg: 0
        };

        return NextResponse.json({
          success: true,
          data: {
            overall: defaultStats,
            coldroom1: defaultStats,
            coldroom2: defaultStats,
            lastTemperatureLogs: [],
            recentRepacking: []
          }
        });
      }
    }

    // Default: return cold rooms list
    const coldRooms = [
      {
        id: 'coldroom1',
        name: 'Cold Room 1',
        current_temperature: 5,
        capacity: 100,
        occupied: 0
      },
      {
        id: 'coldroom2',
        name: 'Cold Room 2',
        current_temperature: 5,
        capacity: 100,
        occupied: 0
      }
    ];

    return NextResponse.json(coldRooms);

  } catch (error: any) {
    console.error('GET /api/cold-room Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint - FIXED VERSION (without supplier_id)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('POST /api/cold-room - Action:', data.action);

    if (data.action === 'load-boxes') {
      // Validate boxes data
      if (!Array.isArray(data.boxesData) || data.boxesData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No boxes data provided' },
          { status: 400 }
        );
      }

      const results = [];
      const errors = [];

      console.log(`📤 Processing ${data.boxesData.length} boxes for cold room...`);

      // Process each box
      for (const boxData of data.boxesData) {
        try {
          // Generate IDs
          const boxId = `BOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const palletId = boxData.palletId || `PAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const supplierName = boxData.supplierName || 'Unknown Supplier';
          const region = boxData.region || '';

          console.log('💾 Saving box to database:', {
            boxId,
            supplierName,
            palletId,
            variety: boxData.variety,
            quantity: boxData.quantity,
            coldRoomId: boxData.coldRoomId
          });

          // FIXED: Insert into cold_room_boxes WITHOUT supplier_id column
          await prisma.$executeRaw`
            INSERT INTO cold_room_boxes (
              id,
              variety,
              box_type,
              size,
              grade,
              quantity,
              cold_room_id,
              supplier_name,
              pallet_id,
              region,
              created_at
            ) VALUES (
              ${boxId},
              ${boxData.variety},
              ${boxData.boxType},
              ${boxData.size},
              ${boxData.grade},
              ${boxData.quantity},
              ${boxData.coldRoomId},
              ${supplierName},
              ${palletId},
              ${region},
              NOW()
            )
          `;

          results.push({
            boxId,
            supplierName,
            palletId,
            region,
            variety: boxData.variety,
            quantity: boxData.quantity,
            coldRoomId: boxData.coldRoomId
          });

          console.log(`✅ Box saved: ${boxId}`);

        } catch (boxError: any) {
          console.error('❌ Error processing box:', boxData, boxError);
          errors.push({
            boxData,
            error: boxError.message
          });
        }
      }

      // Update counting records status if countingRecordIds provided
      if (Array.isArray(data.countingRecordIds) && data.countingRecordIds.length > 0) {
        for (const recordId of data.countingRecordIds) {
          try {
            await prisma.$executeRaw`
              UPDATE counting_records 
              SET status = 'completed',
                  for_coldroom = false
              WHERE id = ${recordId}
            `;
            console.log(`✅ Updated counting record ${recordId} to completed`);
          } catch (updateError: any) {
            console.error(`❌ Error updating counting record ${recordId}:`, updateError);
          }
        }
      }

      // Create pallets for boxes that meet threshold
      const palletResults = [];
      for (const result of results) {
        try {
          const boxesPerPallet = result.boxType === '4kg' ? 288 : 120;
          const palletCount = Math.floor(result.quantity / boxesPerPallet);

          if (palletCount > 0) {
            const palletId = `PAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            await prisma.$executeRaw`
              INSERT INTO cold_room_pallets (
                id,
                variety,
                box_type,
                size,
                grade,
                pallet_count,
                cold_room_id,
                created_at,
                last_updated
              ) VALUES (
                ${palletId},
                ${result.variety},
                ${result.boxType || '4kg'},
                ${result.size || 'size24'},
                ${result.grade || 'class1'},
                ${palletCount},
                ${result.coldRoomId},
                NOW(),
                NOW()
              )
            `;
            
            palletResults.push({
              palletId,
              variety: result.variety,
              boxType: result.boxType,
              count: palletCount,
              coldRoomId: result.coldRoomId
            });
            
            console.log(`✅ Created ${palletCount} pallets for ${result.variety} ${result.boxType}`);
          }
        } catch (palletError: any) {
          console.error('❌ Error creating pallet:', palletError);
        }
      }

      console.log(`✅ Successfully loaded ${results.length} box types to cold room`);

      return NextResponse.json({
        success: true,
        data: {
          loadedCount: results.length,
          results,
          palletResults,
          errors: errors.length > 0 ? errors : undefined
        },
        message: `Successfully loaded ${results.length} box types to cold room`
      });

    } else if (data.action === 'record-temperature') {
      // Record temperature logic
      const id = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO temperature_logs (
          id,
          cold_room_id,
          temperature,
          timestamp,
          recorded_by
        ) VALUES (
          ${id},
          ${data.coldRoomId},
          ${data.temperature},
          NOW(),
          ${data.recordedBy || 'Warehouse Staff'}
        )
      `;

      return NextResponse.json({
        success: true,
        message: 'Temperature recorded successfully'
      });

    } else if (data.action === 'record-repacking') {
      // Record repacking logic
      const id = `REPACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO repacking_records (
          id,
          cold_room_id,
          removed_boxes,
          returned_boxes,
          rejected_boxes,
          notes,
          timestamp,
          processed_by
        ) VALUES (
          ${id},
          ${data.coldRoomId},
          ${JSON.stringify(data.removedBoxes || [])},
          ${JSON.stringify(data.returnedBoxes || [])},
          ${data.rejectedBoxes || 0},
          ${data.notes || ''},
          NOW(),
          ${data.processedBy || 'Warehouse Staff'}
        )
      `;

      // Update inventory based on repacking
      for (const box of (data.removedBoxes || [])) {
        await prisma.$executeRaw`
          UPDATE cold_room_boxes 
          SET quantity = quantity - ${box.quantity}
          WHERE cold_room_id = ${data.coldRoomId}
            AND variety = ${box.variety}
            AND box_type = ${box.boxType}
            AND size = ${box.size}
            AND grade = ${box.grade}
            AND quantity >= ${box.quantity}
        `;
      }

      for (const box of (data.returnedBoxes || [])) {
        // Check if box exists
        const existing = await prisma.$queryRaw`
          SELECT id FROM cold_room_boxes 
          WHERE cold_room_id = ${data.coldRoomId}
            AND variety = ${box.variety}
            AND box_type = ${box.boxType}
            AND size = ${box.size}
            AND grade = ${box.grade}
          LIMIT 1
        `;

        if (Array.isArray(existing) && existing.length > 0) {
          // Update existing
          await prisma.$executeRaw`
            UPDATE cold_room_boxes 
            SET quantity = quantity + ${box.quantity}
            WHERE id = ${existing[0].id}
          `;
        } else {
          // Create new
          const boxId = `BOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await prisma.$executeRaw`
            INSERT INTO cold_room_boxes (
              id,
              variety,
              box_type,
              size,
              grade,
              quantity,
              cold_room_id,
              created_at
            ) VALUES (
              ${boxId},
              ${box.variety},
              ${box.boxType},
              ${box.size},
              ${box.grade},
              ${box.quantity},
              ${data.coldRoomId},
              NOW()
            )
          `;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Repacking recorded and inventory updated'
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('POST /api/cold-room Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}