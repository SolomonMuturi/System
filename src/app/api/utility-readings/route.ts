// app/api/utility-readings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema for what comes from frontend
const utilityReadingInputSchema = z.object({
  powerOpening: z.string().min(1, 'Power opening reading is required'),
  powerClosing: z.string().min(1, 'Power closing reading is required'),
  waterOpening: z.string().min(1, 'Water opening reading is required'),
  waterClosing: z.string().min(1, 'Water closing reading is required'),
  generatorStart: z.string().regex(/^\d{2}:\d{2}$/, 'Generator start time must be in HH:MM format'),
  generatorStop: z.string().regex(/^\d{2}:\d{2}$/, 'Generator stop time must be in HH:MM format'),
  dieselRefill: z.string().optional().nullable(),
  recordedBy: z.string().min(1, 'Recorded by is required'),
  shift: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Received request body:', body);

    // Validate input
    const parsed = utilityReadingInputSchema.parse(body);
    console.log('✅ Parsed data:', parsed);

    // Convert numeric values
    const powerOpening = parseFloat(parsed.powerOpening);
    const powerClosing = parseFloat(parsed.powerClosing);
    const waterOpening = parseFloat(parsed.waterOpening);
    const waterClosing = parseFloat(parsed.waterClosing);
    
    // Handle optional nullable fields
    const dieselRefill = parsed.dieselRefill && parsed.dieselRefill.trim() !== '' 
      ? parseFloat(parsed.dieselRefill) 
      : null;

    // Validate logic
    if (powerClosing < powerOpening) {
      return NextResponse.json(
        { error: 'Power closing reading must be greater than opening reading' },
        { status: 400 }
      );
    }
    if (waterClosing < waterOpening) {
      return NextResponse.json(
        { error: 'Water closing reading must be greater than opening reading' },
        { status: 400 }
      );
    }

    // Derived calculations
    const powerConsumed = powerClosing - powerOpening;
    const waterConsumed = waterClosing - waterOpening;

    // Generator runtime calculation
    const [startHour, startMin] = parsed.generatorStart.split(':').map(Number);
    const [stopHour, stopMin] = parsed.generatorStop.split(':').map(Number);

    let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalHours = totalMinutes / 60;
    const dieselConsumed = totalHours * 7;

    const formatTimeDisplay = () => {
      if (hours === 0 && minutes === 0) return '0 hours';
      const parts = [];
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      return parts.join(' ');
    };
    const timeConsumed = formatTimeDisplay();

    console.log('🧮 Calculated values:', {
      powerConsumed,
      waterConsumed,
      dieselConsumed,
      timeConsumed
    });

    // Try Prisma create first
    try {
      console.log('🔄 Attempting Prisma create...');
      const reading = await prisma.utility_readings.create({
        data: {
          // DO NOT include id, date, createdAt, updatedAt - they have defaults
          powerOpening: powerOpening.toString(),
          powerClosing: powerClosing.toString(),
          powerConsumed: powerConsumed.toString(),
          waterOpening: waterOpening.toString(),
          waterClosing: waterClosing.toString(),
          waterConsumed: waterConsumed.toString(),
          generatorStart: parsed.generatorStart,
          generatorStop: parsed.generatorStop,
          timeConsumed,
          dieselConsumed: dieselConsumed.toString(),
          dieselRefill: dieselRefill ? dieselRefill.toString() : null,
          recordedBy: parsed.recordedBy,
          shift: parsed.shift || null,
          notes: parsed.notes || null,
        },
      });
      
      console.log('✅ Successfully created record via Prisma:', reading.id);
      return NextResponse.json({ 
        success: true, 
        reading,
        calculated: {
          powerConsumed,
          waterConsumed,
          timeConsumed,
          dieselConsumed,
        }
      }, { status: 201 });
      
    } catch (prismaError: any) {
      console.error('❌ Prisma create failed:', prismaError);
      console.error('❌ Error name:', prismaError.name);
      console.error('❌ Error message:', prismaError.message);
      
      if (prismaError.code) {
        console.error('❌ Prisma error code:', prismaError.code);
      }
      
      // Fallback to raw SQL to get detailed MySQL error
      console.log('🔄 Attempting raw SQL insert as fallback...');
      
      try {
        const sqlResult = await prisma.$executeRaw`
          INSERT INTO utility_readings (
            powerOpening, powerClosing, powerConsumed,
            waterOpening, waterClosing, waterConsumed,
            generatorStart, generatorStop, timeConsumed, dieselConsumed,
            dieselRefill, recordedBy, shift, notes
          ) VALUES (
            ${powerOpening}, ${powerClosing}, ${powerConsumed},
            ${waterOpening}, ${waterClosing}, ${waterConsumed},
            ${parsed.generatorStart}, ${parsed.generatorStop}, 
            ${timeConsumed}, ${dieselConsumed},
            ${dieselRefill}, ${parsed.recordedBy}, 
            ${parsed.shift || null}, ${parsed.notes || null}
          )
        `;
        
        console.log('✅ Raw SQL insert successful, rows affected:', sqlResult);
        
        // Fetch the newly created record
        const newReading = await prisma.utility_readings.findFirst({
          orderBy: { date: 'desc' },
          where: {
            recordedBy: parsed.recordedBy,
            generatorStart: parsed.generatorStart,
            generatorStop: parsed.generatorStop,
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          reading: newReading,
          calculated: {
            powerConsumed,
            waterConsumed,
            timeConsumed,
            dieselConsumed,
          },
          note: 'Created via raw SQL fallback'
        }, { status: 201 });
        
      } catch (sqlError: any) {
        console.error('❌ Raw SQL insert also failed!');
        console.error('❌ MySQL error message:', sqlError.message);
        console.error('❌ MySQL error code:', sqlError.code);
        console.error('❌ Full SQL error:', sqlError);
        
        // Try one more diagnostic query
        try {
          const tableInfo = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM utility_readings
          `;
          console.log('ℹ️ Table row count:', tableInfo);
        } catch (countError) {
          console.error('❌ Even count query failed:', countError);
        }
        
        throw new Error(`Database insertion failed: ${sqlError.message}`);
      }
    }
    
  } catch (error) {
    console.error('🔥 Top-level error in utility readings POST:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check server logs for detailed MySQL error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '30');

    // Build where clause
    const where: any = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    const readings = await prisma.utility_readings.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    // Calculate totals for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysReadings = await prisma.utility_readings.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const totals = {
      totalPower: todaysReadings.reduce((sum, r) => sum + Number(r.powerConsumed), 0),
      totalWater: todaysReadings.reduce((sum, r) => sum + Number(r.waterConsumed), 0),
      totalDiesel: todaysReadings.reduce((sum, r) => sum + Number(r.dieselConsumed), 0),
      count: todaysReadings.length,
    };

    return NextResponse.json({
      readings,
      totals,
      meta: {
        count: readings.length,
        todayCount: todaysReadings.length,
      },
    });
    
  } catch (error) {
    console.error('Error fetching utility readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch utility readings' },
      { status: 500 }
    );
  }
}