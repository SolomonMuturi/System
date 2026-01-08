import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/weights/kpi called');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Calculate one hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Get count and data for today
    const [todayData, yesterdayData, lastHourData] = await Promise.all([
      // Today's data
      prisma.weight_entries.findMany({
        where: {
          timestamp: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          id: true,
          net_weight: true,
          fuerte_weight: true,
          hass_weight: true,
          fuerte_crates: true,
          hass_crates: true,
          created_at: true,
          region: true,
        },
      }),
      
      // Yesterday's data for comparison
      prisma.weight_entries.findMany({
        where: {
          timestamp: {
            gte: yesterday,
            lt: today,
          },
        },
        select: {
          id: true,
          net_weight: true,
          fuerte_weight: true,
          hass_weight: true,
          fuerte_crates: true,
          hass_crates: true,
        },
      }),
      
      // Last hour data
      prisma.weight_entries.findMany({
        where: {
          timestamp: {
            gte: oneHourAgo,
          },
        },
        select: {
          id: true,
          net_weight: true,
        },
      }),
    ]);
    
    // Calculate today's metrics
    const todayCount = todayData.length;
    
    // Calculate total weight with better handling
    const totalWeightToday = todayData.reduce((sum, entry) => {
      // Prioritize net_weight, fall back to fuerte_weight + hass_weight
      let weight = Number(entry.net_weight) || 0;
      if (weight === 0) {
        weight = (Number(entry.fuerte_weight) || 0) + (Number(entry.hass_weight) || 0);
      }
      return sum + weight;
    }, 0);
    
    // Calculate yesterday's total weight for comparison
    const totalWeightYesterday = yesterdayData.reduce((sum, entry) => {
      let weight = Number(entry.net_weight) || 0;
      if (weight === 0) {
        weight = (Number(entry.fuerte_weight) || 0) + (Number(entry.hass_weight) || 0);
      }
      return sum + weight;
    }, 0);
    
    // Calculate weight change percentage
    let weightChangePercentage = 0;
    if (totalWeightYesterday > 0) {
      weightChangePercentage = ((totalWeightToday - totalWeightYesterday) / totalWeightYesterday) * 100;
    }
    
    // Calculate last hour count
    const lastHourCount = lastHourData.length;
    
    // Calculate average weight per entry today
    const avgWeightPerEntry = todayCount > 0 ? totalWeightToday / todayCount : 0;
    
    // Calculate total crates today
    const totalCratesToday = todayData.reduce((sum, entry) => {
      return sum + (Number(entry.fuerte_crates) || 0) + (Number(entry.hass_crates) || 0);
    }, 0);
    
    // Calculate Fuerte vs Hass breakdown
    const fuerteWeightToday = todayData.reduce((sum, entry) => {
      return sum + (Number(entry.fuerte_weight) || 0);
    }, 0);
    
    const hassWeightToday = todayData.reduce((sum, entry) => {
      return sum + (Number(entry.hass_weight) || 0);
    }, 0);
    
    const fuertePercentage = totalWeightToday > 0 ? (fuerteWeightToday / totalWeightToday) * 100 : 0;
    const hassPercentage = totalWeightToday > 0 ? (hassWeightToday / totalWeightToday) * 100 : 0;
    
    // Get top regions
    const regionData = todayData.reduce((acc, entry) => {
      const region = entry.region || 'Unknown';
      if (!acc[region]) {
        acc[region] = { weight: 0, count: 0 };
      }
      
      let weight = Number(entry.net_weight) || 0;
      if (weight === 0) {
        weight = (Number(entry.fuerte_weight) || 0) + (Number(entry.hass_weight) || 0);
      }
      
      acc[region].weight += weight;
      acc[region].count += 1;
      return acc;
    }, {} as Record<string, { weight: number; count: number }>);
    
    const topRegions = Object.entries(regionData)
      .map(([region, data]) => ({
        region,
        weight: data.weight,
        count: data.count,
        percentage: totalWeightToday > 0 ? (data.weight / totalWeightToday) * 100 : 0,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3); // Top 3 regions
    
    return NextResponse.json({
      // Basic counts
      todayCount,
      lastHourCount,
      
      // Weight metrics
      totalWeightToday: parseFloat(totalWeightToday.toFixed(2)),
      totalWeightYesterday: parseFloat(totalWeightYesterday.toFixed(2)),
      weightChangePercentage: parseFloat(weightChangePercentage.toFixed(1)),
      avgWeightPerEntry: parseFloat(avgWeightPerEntry.toFixed(2)),
      
      // Crate metrics
      totalCratesToday,
      
      // Variety breakdown
      varietyBreakdown: {
        fuerte: {
          weight: parseFloat(fuerteWeightToday.toFixed(2)),
          percentage: parseFloat(fuertePercentage.toFixed(1)),
        },
        hass: {
          weight: parseFloat(hassWeightToday.toFixed(2)),
          percentage: parseFloat(hassPercentage.toFixed(1)),
        },
      },
      
      // Top regions
      topRegions,
      
      // Efficiency metrics
      cratesPerKg: totalCratesToday > 0 ? parseFloat((totalWeightToday / totalCratesToday).toFixed(2)) : 0,
      entriesPerHour: parseFloat((todayCount / (Date.now() - today.getTime()) * 3600000).toFixed(1)),
      
      // Performance indicators
      performance: {
        weightPerHour: parseFloat((totalWeightToday / ((Date.now() - today.getTime()) / 3600000)).toFixed(2)),
        isActive: lastHourCount > 0,
        peakHour: lastHourCount, // Simplified - you could calculate actual peak hour
      },
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching KPI data:', error);
    
    // Return structured error response
    return NextResponse.json({
      error: 'Failed to fetch KPI data',
      message: error.message,
      // Return safe defaults
      todayCount: 0,
      lastHourCount: 0,
      totalWeightToday: 0,
      totalWeightYesterday: 0,
      weightChangePercentage: 0,
      avgWeightPerEntry: 0,
      totalCratesToday: 0,
      varietyBreakdown: {
        fuerte: { weight: 0, percentage: 0 },
        hass: { weight: 0, percentage: 0 },
      },
      topRegions: [],
      cratesPerKg: 0,
      entriesPerHour: 0,
      performance: {
        weightPerHour: 0,
        isActive: false,
        peakHour: 0,
      },
    }, { status: 500 });
  }
}