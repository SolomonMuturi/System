import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    // Fetch cold rooms
    if (action === 'cold-rooms') {
      const coldRooms = await prisma.cold_rooms.findMany();
      return NextResponse.json({ success: true, data: coldRooms });
    }

    // Fetch cold room boxes
    if (action === 'boxes') {
      const boxes = await prisma.cold_room_boxes.findMany({
        include: {
          counting_record: true,
          pallet: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      return NextResponse.json({ success: true, data: boxes });
    }

    // Fetch pallets with boxes
    if (action === 'pallets') {
      const pallets = await prisma.cold_room_pallets.findMany({
        include: {
          boxes: {
            orderBy: {
              created_at: 'desc',
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      return NextResponse.json({ success: true, data: pallets });
    }

    // Fetch temperature logs
    if (action === 'temperature') {
      const logs = await prisma.temperature_logs.findMany({
        orderBy: {
          timestamp: 'desc',
        },
      });
      return NextResponse.json({ success: true, data: logs });
    }

    // Fetch repacking records
    if (action === 'repacking') {
      const records = await prisma.repacking_records.findMany({
        orderBy: {
          timestamp: 'desc',
        },
      });
      return NextResponse.json({ success: true, data: records });
    }

    // Fetch cold room stats
    if (action === 'stats') {
      const boxes = await prisma.cold_room_boxes.findMany();
      const pallets = await prisma.cold_room_pallets.findMany({
        include: { boxes: true },
      });
      const temperatureLogs = await prisma.temperature_logs.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      });
      const repackingRecords = await prisma.repacking_records.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      // Calculate stats
      const stats = {
        overall: calculateStats(boxes, pallets),
        coldroom1: calculateStats(
          boxes.filter(b => b.cold_room_id === 'coldroom1'),
          pallets.filter(p => p.cold_room_id === 'coldroom1')
        ),
        coldroom2: calculateStats(
          boxes.filter(b => b.cold_room_id === 'coldroom2'),
          pallets.filter(p => p.cold_room_id === 'coldroom2')
        ),
        lastTemperatureLogs: temperatureLogs,
        recentRepacking: repackingRecords,
      };

      return NextResponse.json({ success: true, data: stats });
    }

    // Fetch counting records with remaining boxes
    if (action === 'remaining-boxes') {
      const records = await prisma.countingRecord.findMany({
        where: {
          for_coldroom: true,
          OR: [
            { status: 'pending_coldroom' },
            { status: 'partially_loaded' },
          ],
        },
        include: {
          cold_room_boxes: true,
        },
        orderBy: {
          submitted_at: 'desc',
        },
      });

      const processedRecords = records.map(record => {
        let counting_data = {};
        let totals = {};
        let boxes_loaded_to_coldroom = {};
        let remaining_boxes = {};
        let total_remaining_boxes = 0;

        try {
          counting_data = JSON.parse(record.counting_data);
          totals = JSON.parse(record.totals || '{}');
          boxes_loaded_to_coldroom = JSON.parse(record.boxes_loaded_to_coldroom || '{}');
          
          // Calculate remaining boxes
          Object.keys(counting_data).forEach(key => {
            const loadedQty = boxes_loaded_to_coldroom[key] || 0;
            const originalQty = Number(counting_data[key]) || 0;
            const remaining = Math.max(0, originalQty - loadedQty);
            
            if (remaining > 0) {
              remaining_boxes[key] = remaining;
              total_remaining_boxes += remaining;
            }
          });
        } catch (error) {
          console.error('Error parsing JSON data:', error);
        }

        const totalOriginalBoxes = Object.values(counting_data).reduce(
          (sum: number, qty: any) => sum + (Number(qty) || 0), 0
        );

        const loadedBoxes = totalOriginalBoxes - total_remaining_boxes;
        const loading_progress_percentage = totalOriginalBoxes > 0 
          ? Math.min(100, Math.round((loadedBoxes / totalOriginalBoxes) * 100))
          : 0;

        return {
          ...record,
          counting_data,
          totals,
          boxes_loaded_to_coldroom,
          remaining_boxes,
          total_remaining_boxes,
          has_remaining_boxes: total_remaining_boxes > 0,
          total_boxes_loaded: loadedBoxes,
          loading_progress_percentage,
        };
      });

      return NextResponse.json({ success: true, data: processedRecords });
    }

    // Fetch pallet boxes
    if (action === 'pallet-boxes') {
      const palletId = searchParams.get('palletId');
      if (!palletId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Pallet ID is required' 
        }, { status: 400 });
      }

      const boxes = await prisma.cold_room_boxes.findMany({
        where: { pallet_id: palletId },
        include: {
          counting_record: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return NextResponse.json({ success: true, data: boxes });
    }

    // Check for existing boxes with same properties
    if (action === 'check-existing-boxes') {
      const variety = searchParams.get('variety');
      const boxType = searchParams.get('boxType');
      const size = searchParams.get('size');
      const grade = searchParams.get('grade');
      const countingRecordId = searchParams.get('countingRecordId');
      const coldRoomId = searchParams.get('coldRoomId');

      if (!variety || !boxType || !size || !grade || !coldRoomId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required parameters' 
        }, { status: 400 });
      }

      // Check for existing boxes with same properties
      const existingBoxes = await prisma.cold_room_boxes.findMany({
        where: {
          variety,
          box_type: boxType,
          size,
          grade,
          cold_room_id: coldRoomId,
          is_in_pallet: false,
          ...(countingRecordId && { counting_record_id: countingRecordId })
        }
      });

      const totalQuantity = existingBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0);

      return NextResponse.json({ 
        success: true, 
        exists: existingBoxes.length > 0,
        quantity: totalQuantity,
        boxes: existingBoxes
      });
    }

    // Check for existing pallets with same combination
    if (action === 'check-existing-pallet') {
      const coldRoomId = searchParams.get('coldRoomId');
      const boxGroups = searchParams.get('boxGroups');

      if (!coldRoomId || !boxGroups) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required parameters' 
        }, { status: 400 });
      }

      try {
        const groups = JSON.parse(boxGroups);
        
        // Get all pallets in the cold room
        const existingPallets = await prisma.cold_room_pallets.findMany({
          where: {
            cold_room_id: coldRoomId,
            is_manual: true
          },
          include: {
            boxes: true
          }
        });

        // Check each pallet for matching box combinations
        for (const pallet of existingPallets) {
          const palletBoxes = pallet.boxes || [];
          
          // Group pallet boxes by type
          const palletBoxGroups: Record<string, number> = {};
          palletBoxes.forEach(box => {
            const key = `${box.variety}_${box.box_type}_${box.grade}_${box.size}`;
            palletBoxGroups[key] = (palletBoxGroups[key] || 0) + (box.quantity || 0);
          });

          // Compare with requested groups
          let allMatch = true;
          for (const group of groups) {
            const groupKey = `${group.variety}_${group.boxType}_${group.grade}_${group.size}`;
            const groupQty = group.quantity;
            
            if (palletBoxGroups[groupKey] !== groupQty) {
              allMatch = false;
              break;
            }
          }

          if (allMatch) {
            return NextResponse.json({ 
              success: true, 
              exists: true,
              palletId: pallet.id,
              palletName: pallet.pallet_name
            });
          }
        }

        return NextResponse.json({ 
          success: true, 
          exists: false 
        });
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid box groups format' 
        }, { status: 400 });
      }
    }

    // Get grouped available boxes
    if (action === 'grouped-boxes') {
      const coldRoomId = searchParams.get('coldRoomId');
      const showOnlyAvailable = searchParams.get('showOnlyAvailable') === 'true';

      const whereClause: any = {
        ...(coldRoomId && { cold_room_id: coldRoomId })
      };

      if (showOnlyAvailable) {
        whereClause.is_in_pallet = false;
        whereClause.loading_sheet_id = null;
      }

      const boxes = await prisma.cold_room_boxes.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc',
        },
      });

      // Group boxes by size, variety, type, and grade
      const groupedBoxes: Record<string, {
        size: string;
        variety: string;
        box_type: string;
        grade: string;
        cold_room_id: string;
        totalQuantity: number;
        boxes: any[];
      }> = {};

      boxes.forEach(box => {
        const key = `${box.size}_${box.variety}_${box.box_type}_${box.grade}_${box.cold_room_id}`;
        
        if (!groupedBoxes[key]) {
          groupedBoxes[key] = {
            size: box.size,
            variety: box.variety,
            box_type: box.box_type,
            grade: box.grade,
            cold_room_id: box.cold_room_id,
            totalQuantity: 0,
            boxes: []
          };
        }
        
        groupedBoxes[key].totalQuantity += box.quantity || 0;
        groupedBoxes[key].boxes.push(box);
      });

      return NextResponse.json({ 
        success: true, 
        data: Object.values(groupedBoxes)
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in cold-room API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Load boxes to cold room
    if (action === 'load-boxes') {
      const { boxesData, countingRecordIds } = body;
      
      const createdBoxes = [];
      const updatedCountingRecords = [];

      // Check for duplicates before creating
      for (const boxData of boxesData) {
        // Check if box already exists
        const existingBoxes = await prisma.cold_room_boxes.findMany({
          where: {
            variety: boxData.variety,
            box_type: boxData.boxType,
            size: boxData.size,
            grade: boxData.grade,
            cold_room_id: boxData.coldRoomId,
            is_in_pallet: false,
            counting_record_id: boxData.countingRecordId || null
          }
        });

        const totalExisting = existingBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0);

        if (totalExisting >= boxData.quantity) {
          // Boxes already exist, skip creation
          console.log(`Skipping duplicate: ${boxData.variety} ${boxData.boxType} ${boxData.size} ${boxData.grade} - ${boxData.quantity} boxes already exist`);
          continue;
        }

        // Create only the difference
        const quantityToCreate = boxData.quantity - totalExisting;
        
        if (quantityToCreate > 0) {
          const box = await prisma.cold_room_boxes.create({
            data: {
              variety: boxData.variety,
              box_type: boxData.boxType,
              size: boxData.size,
              grade: boxData.grade,
              quantity: quantityToCreate,
              cold_room_id: boxData.coldRoomId,
              supplier_name: boxData.supplierName || 'Unknown Supplier',
              pallet_id: boxData.palletId || null,
              region: boxData.region || '',
              counting_record_id: boxData.countingRecordId || null,
              is_in_pallet: !!boxData.palletId,
              converted_to_pallet_at: boxData.palletId ? new Date() : null,
            },
          });
          createdBoxes.push(box);
        }
      }

      // Update counting records
      if (countingRecordIds && countingRecordIds.length > 0) {
        for (const recordId of countingRecordIds) {
          const record = await prisma.countingRecord.findUnique({
            where: { id: recordId },
          });

          if (record) {
            let counting_data = {};
            let boxes_loaded_to_coldroom = {};
            
            try {
              counting_data = JSON.parse(record.counting_data);
              boxes_loaded_to_coldroom = JSON.parse(record.boxes_loaded_to_coldroom || '{}');
              
              // Update loaded boxes count
              boxesData
                .filter(box => box.countingRecordId === recordId)
                .forEach(box => {
                  const key = `${box.variety}_${box.boxType}_${box.grade}_${box.size}`;
                  const currentLoaded = boxes_loaded_to_coldroom[key] || 0;
                  boxes_loaded_to_coldroom[key] = currentLoaded + box.quantity;
                });

              const totalLoaded = Object.values(boxes_loaded_to_coldroom)
                .reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0);
              
              const totalOriginal = Object.values(counting_data)
                .reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0);
              
              const progress = totalOriginal > 0 
                ? Math.min(100, Math.round((totalLoaded / totalOriginal) * 100))
                : 0;
              
              const status = progress === 100 ? 'loaded_to_coldroom' : 
                            progress > 0 ? 'partially_loaded' : 'pending_coldroom';

              const updatedRecord = await prisma.countingRecord.update({
                where: { id: recordId },
                data: {
                  boxes_loaded_to_coldroom: JSON.stringify(boxes_loaded_to_coldroom),
                  total_boxes_loaded: totalLoaded,
                  loading_progress_percentage: progress,
                  status: status,
                  ...(progress === 100 && {
                    loaded_to_coldroom_at: new Date(),
                    cold_room_loaded_to: boxesData[0]?.coldRoomId || 'coldroom1',
                  }),
                },
              });

              updatedCountingRecords.push(updatedRecord);
            } catch (error) {
              console.error('Error updating counting record:', error);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          createdBoxes,
          updatedCountingRecords,
          message: `Loaded ${createdBoxes.length} new boxes successfully`,
        },
      });
    }

    // Create manual pallet with size grouping
    if (action === 'create-manual-pallet') {
      const { palletName, coldRoomId, boxes, boxesPerPallet } = body;

      if (!palletName || !coldRoomId || !boxes || boxes.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields' 
        }, { status: 400 });
      }

      // Check for duplicate pallet with same box combination
      const duplicateCheck = await prisma.$transaction(async (tx) => {
        const existingPallets = await tx.cold_room_pallets.findMany({
          where: {
            cold_room_id: coldRoomId,
            is_manual: true
          },
          include: {
            boxes: true
          }
        });

        for (const pallet of existingPallets) {
          const palletBoxes = pallet.boxes || [];
          const palletBoxGroups: Record<string, number> = {};
          
          palletBoxes.forEach(box => {
            const key = `${box.variety}_${box.box_type}_${box.grade}_${box.size}`;
            palletBoxGroups[key] = (palletBoxGroups[key] || 0) + (box.quantity || 0);
          });

          // Compare with requested boxes
          let allMatch = true;
          for (const box of boxes) {
            const boxKey = `${box.variety}_${box.boxType}_${box.grade}_${box.size}`;
            const boxQty = box.quantity;
            
            if (palletBoxGroups[boxKey] !== boxQty) {
              allMatch = false;
              break;
            }
          }

          if (allMatch) {
            return { isDuplicate: true, palletId: pallet.id, palletName: pallet.pallet_name };
          }
        }

        return { isDuplicate: false };
      });

      if (duplicateCheck.isDuplicate) {
        return NextResponse.json({
          success: false,
          error: `Duplicate pallet found: "${duplicateCheck.palletName}" already has the exact same box combination`,
          palletId: duplicateCheck.palletId
        }, { status: 409 });
      }

      // Calculate totals
      const totalBoxes = boxes.reduce((sum: number, box: any) => sum + (box.quantity || 0), 0);
      const totalWeight = boxes.reduce((sum: number, box: any) => {
        const boxWeight = box.boxType === '4kg' ? 4 : 10;
        return sum + (box.quantity * boxWeight);
      }, 0);

      try {
        // Create pallet in transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
          // Create pallet
          const pallet = await tx.cold_room_pallets.create({
            data: {
              pallet_name: palletName,
              cold_room_id: coldRoomId,
              pallet_count: 1,
              is_manual: true,
              total_boxes: totalBoxes,
              total_weight_kg: totalWeight,
              boxes_per_pallet: boxesPerPallet,
            },
          });

          const boxUpdates = [];
          const newBoxes: string[] = [];
          const allProcessedBoxIds: string[] = [];

          // Process each box group
          for (const boxData of boxes) {
            if (boxData.quantity <= 0) continue;

            // Find available boxes (not in pallet, not assigned to loading sheet)
            const availableBoxes = await tx.cold_room_boxes.findMany({
              where: {
                variety: boxData.variety,
                box_type: boxData.boxType,
                size: boxData.size,
                grade: boxData.grade,
                cold_room_id: coldRoomId,
                is_in_pallet: false,
                loading_sheet_id: null,
                quantity: { gt: 0 }
              },
              orderBy: { created_at: 'asc' },
            });

            let remainingQty = boxData.quantity;
            const processedBoxIds: string[] = [];

            // Use existing boxes first
            for (const box of availableBoxes) {
              if (remainingQty <= 0) break;

              if (box.quantity <= remainingQty) {
                // Use entire box
                await tx.cold_room_boxes.update({
                  where: { id: box.id },
                  data: {
                    pallet_id: pallet.id,
                    is_in_pallet: true,
                    converted_to_pallet_at: new Date(),
                  },
                });
                
                remainingQty -= box.quantity;
                processedBoxIds.push(box.id);
                boxUpdates.push({
                  boxId: box.id,
                  action: 'full',
                  quantity: box.quantity,
                });
              } else {
                // Split the box
                const newBox = await tx.cold_room_boxes.create({
                  data: {
                    variety: box.variety,
                    box_type: box.box_type,
                    size: box.size,
                    grade: box.grade,
                    quantity: remainingQty,
                    cold_room_id: box.cold_room_id,
                    supplier_name: box.supplier_name,
                    region: box.region,
                    counting_record_id: box.counting_record_id,
                    pallet_id: pallet.id,
                    is_in_pallet: true,
                    converted_to_pallet_at: new Date(),
                  },
                });

                // Update original box with remaining quantity
                await tx.cold_room_boxes.update({
                  where: { id: box.id },
                  data: {
                    quantity: box.quantity - remainingQty,
                  },
                });

                remainingQty = 0;
                processedBoxIds.push(box.id);
                newBoxes.push(newBox.id);
                boxUpdates.push({
                  boxId: box.id,
                  newBoxId: newBox.id,
                  action: 'split',
                  quantity: remainingQty,
                });
              }
            }

            // Add to the main array
            allProcessedBoxIds.push(...processedBoxIds.filter(Boolean));

            // Create new box if not enough available
            if (remainingQty > 0) {
              const newBox = await tx.cold_room_boxes.create({
                data: {
                  variety: boxData.variety,
                  box_type: boxData.boxType,
                  size: boxData.size,
                  grade: boxData.grade,
                  quantity: remainingQty,
                  cold_room_id: coldRoomId,
                  supplier_name: boxData.supplierName || 'Unknown Supplier',
                  region: boxData.region || '',
                  counting_record_id: boxData.countingRecordId || null,
                  pallet_id: pallet.id,
                  is_in_pallet: true,
                  converted_to_pallet_at: new Date(),
                },
              });
              newBoxes.push(newBox.id);
              boxUpdates.push({
                boxId: newBox.id,
                action: 'new',
                quantity: remainingQty,
              });
            }
          }

          return { pallet, boxUpdates, processedBoxIds: allProcessedBoxIds.filter(Boolean), newBoxes };
        });

        return NextResponse.json({
          success: true,
          data: {
            pallet: result.pallet,
            boxUpdates: result.boxUpdates,
            totalBoxes,
            totalWeight,
            fullPallets: Math.floor(totalBoxes / boxesPerPallet),
            remainingBoxes: totalBoxes % boxesPerPallet,
            message: `Pallet "${palletName}" created successfully with ${totalBoxes} boxes`
          },
        });
      } catch (error) {
        console.error('Error creating manual pallet:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create pallet'
        }, { status: 500 });
      }
    }

    // Dissolve pallet
    if (action === 'dissolve-pallet') {
      const { palletId, coldRoomId } = body;

      // Find the pallet with boxes
      const pallet = await prisma.cold_room_pallets.findUnique({
        where: { id: palletId },
        include: { boxes: true },
      });

      if (!pallet) {
        return NextResponse.json({ 
          success: false, 
          error: 'Pallet not found' 
        }, { status: 404 });
      }

      // Return boxes to available inventory
      await prisma.cold_room_boxes.updateMany({
        where: { pallet_id: palletId },
        data: {
          pallet_id: null,
          is_in_pallet: false,
          converted_to_pallet_at: null,
        },
      });

      // Delete the pallet
      await prisma.cold_room_pallets.delete({
        where: { id: palletId },
      });

      return NextResponse.json({
        success: true,
        data: {
          boxesReturned: pallet.boxes.length,
          message: `Pallet dissolved and ${pallet.boxes.length} boxes returned to inventory`,
        },
      });
    }

    // Record temperature
    if (action === 'record-temperature') {
      const { coldRoomId, temperature, recordedBy } = body;

      const log = await prisma.temperature_logs.create({
        data: {
          cold_room_id: coldRoomId,
          temperature: parseFloat(temperature),
          recorded_by: recordedBy || 'Warehouse Staff',
          timestamp: new Date(),
        },
      });

      // Update cold room current temperature
      await prisma.cold_rooms.update({
        where: { id: coldRoomId },
        data: { temperature: parseFloat(temperature) },
      });

      return NextResponse.json({
        success: true,
        data: log,
        message: `Temperature ${temperature}°C recorded for ${coldRoomId}`,
      });
    }

    // Record repacking
    if (action === 'record-repacking') {
      const { coldRoomId, removedBoxes, returnedBoxes, rejectedBoxes, notes, processedBy } = body;

      const record = await prisma.repacking_records.create({
        data: {
          cold_room_id: coldRoomId,
          removed_boxes: JSON.stringify(removedBoxes || []),
          returned_boxes: JSON.stringify(returnedBoxes || []),
          rejected_boxes: rejectedBoxes || 0,
          notes: notes || '',
          processed_by: processedBy || 'Warehouse Staff',
          timestamp: new Date(),
        },
      });

      // Update inventory based on repacking
      for (const box of removedBoxes || []) {
        await decreaseBoxQuantity(coldRoomId, box);
      }

      for (const box of returnedBoxes || []) {
        await increaseBoxQuantity(coldRoomId, box);
      }

      return NextResponse.json({
        success: true,
        data: record,
        message: 'Repacking recorded successfully',
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in cold-room API POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
function calculateStats(boxes: any[], pallets: any[]) {
  const total4kgBoxes = boxes
    .filter(b => b.box_type === '4kg')
    .reduce((sum, b) => sum + (b.quantity || 0), 0);
  
  const total10kgBoxes = boxes
    .filter(b => b.box_type === '10kg')
    .reduce((sum, b) => sum + (b.quantity || 0), 0);
  
  const total4kgPallets = pallets
    .filter(p => p.boxes?.some((b: any) => b.box_type === '4kg'))
    .length;
  
  const total10kgPallets = pallets
    .filter(p => p.boxes?.some((b: any) => b.box_type === '10kg'))
    .length;

  return {
    total4kgBoxes,
    total10kgBoxes,
    total4kgPallets,
    total10kgPallets,
    fuerteClass14kg: boxes
      .filter(b => b.variety === 'fuerte' && b.grade === 'class1' && b.box_type === '4kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
    fuerteClass24kg: boxes
      .filter(b => b.variety === 'fuerte' && b.grade === 'class2' && b.box_type === '4kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
    fuerteClass110kg: boxes
      .filter(b => b.variety === 'fuerte' && b.grade === 'class1' && b.box_type === '10kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
    fuerteClass210kg: boxes
      .filter(b => b.variety === 'fuerte' && b.grade === 'class2' && b.box_type === '10kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
    hassClass14kg: boxes
      .filter(b => b.variety === 'hass' && b.grade === 'class1' && b.box_type === '4kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
    hassClass24kg: boxes
      .filter(b => b.variety === 'hass' && b.grade === 'class2' && b.box_type === '4kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
    hassClass110kg: boxes
      .filter(b => b.variety === 'hass' && b.grade === 'class1' && b.box_type === '10kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
    hassClass210kg: boxes
      .filter(b => b.variety === 'hass' && b.grade === 'class2' && b.box_type === '10kg')
      .reduce((sum, b) => sum + (b.quantity || 0), 0),
  };
}

async function decreaseBoxQuantity(coldRoomId: string, boxData: any) {
  const boxes = await prisma.cold_room_boxes.findMany({
    where: {
      cold_room_id: coldRoomId,
      variety: boxData.variety,
      box_type: boxData.boxType,
      size: boxData.size,
      grade: boxData.grade,
      quantity: { gte: boxData.quantity },
      is_in_pallet: false,
    },
    orderBy: { created_at: 'asc' },
  });

  let remainingQty = boxData.quantity;
  for (const box of boxes) {
    if (remainingQty <= 0) break;

    if (box.quantity <= remainingQty) {
      // Delete box if quantity matches
      await prisma.cold_room_boxes.delete({
        where: { id: box.id },
      });
      remainingQty -= box.quantity;
    } else {
      // Reduce quantity
      await prisma.cold_room_boxes.update({
        where: { id: box.id },
        data: {
          quantity: box.quantity - remainingQty,
        },
      });
      remainingQty = 0;
    }
  }
}

async function increaseBoxQuantity(coldRoomId: string, boxData: any) {
  // Find existing box to update
  const existingBox = await prisma.cold_room_boxes.findFirst({
    where: {
      cold_room_id: coldRoomId,
      variety: boxData.variety,
      box_type: boxData.boxType,
      size: boxData.size,
      grade: boxData.grade,
      is_in_pallet: false,
      loading_sheet_id: null
    },
  });

  if (existingBox) {
    // Update existing box
    await prisma.cold_room_boxes.update({
      where: { id: existingBox.id },
      data: {
        quantity: existingBox.quantity + boxData.quantity,
      },
    });
  } else {
    // Create new box
    await prisma.cold_room_boxes.create({
      data: {
        variety: boxData.variety,
        box_type: boxData.boxType,
        size: boxData.size,
        grade: boxData.grade,
        quantity: boxData.quantity,
        cold_room_id: coldRoomId,
        supplier_name: 'Repacking Return',
        is_in_pallet: false,
      },
    });
  }
}