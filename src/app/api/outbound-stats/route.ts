// /api/outbound-stats/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('📊 GET /api/outbound-stats');
  
  try {
    // Get counts one by one
    const totalLoadingSheets = await prisma.loading_sheets.count();
    
    // FIX: Use correct MySQL syntax for "not null"
    const containersLoaded = await prisma.loading_sheets.count({
      where: {
        NOT: {
          container: null
        }
      }
    });
    
    const activeCarriers = await prisma.carriers.count({
      where: {
        status: 'Active'
      }
    });
    
    const totalAssignments = await prisma.carrier_assignments.count();
    
    const pendingAssignments = await prisma.carrier_assignments.count({
      where: {
        status: 'assigned'
      }
    });
    
    const completedAssignments = await prisma.carrier_assignments.count({
      where: {
        status: 'completed'
      }
    });
    
    const totalShipments = await prisma.shipments.count();
    
    const activeShipments = await prisma.shipments.count({
      where: {
        status: {
          in: ['Preparing_for_Dispatch', 'Ready_for_Dispatch', 'In_Transit']
        }
      }
    });
    
    const delayedShipments = await prisma.shipments.count({
      where: {
        status: 'Delayed'
      }
    });
    
    const deliveredShipments = await prisma.shipments.count({
      where: {
        status: 'Delivered'
      }
    });
    
    // Get unique customers (handle potential errors)
    let uniqueCustomers = 0;
    try {
      const customerGroups = await prisma.shipments.groupBy({
        by: ['customer_id'],
        _count: true
      });
      uniqueCustomers = customerGroups.length;
    } catch (error) {
      console.log('Note: Could not count unique customers', error);
    }
    
    // Get status distribution
    let statusDistribution: any[] = [];
    try {
      statusDistribution = await prisma.shipments.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      });
    } catch (error) {
      console.log('Note: Could not get status distribution', error);
    }
    
    // Convert status for display
    const statusDistMap = statusDistribution.reduce((acc: any, item) => {
      const status = convertDbStatusToDisplay(item.status);
      acc[status] = item._count._all;
      return acc;
    }, {});
    
    const stats = {
      totalLoadingSheets,
      containersLoaded,
      activeCarriers,
      totalAssignments,
      pendingAssignments,
      completedAssignments,
      totalShipments,
      activeShipments,
      delayedShipments,
      deliveredShipments,
      uniqueCustomers,
      statusDistribution: statusDistMap
    };
    
    console.log('✅ Stats calculated:', {
      loadingSheets: stats.totalLoadingSheets,
      carriers: stats.activeCarriers,
      shipments: stats.totalShipments,
      assignments: stats.totalAssignments
    });
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching outbound stats:', error);
    
    // Return fallback data
    return NextResponse.json({
      success: true,
      data: {
        totalLoadingSheets: 0,
        containersLoaded: 0,
        activeCarriers: 0,
        totalAssignments: 0,
        pendingAssignments: 0,
        completedAssignments: 0,
        totalShipments: 0,
        activeShipments: 0,
        delayedShipments: 0,
        deliveredShipments: 0,
        uniqueCustomers: 0,
        statusDistribution: {}
      }
    });
  }
}

// Helper function
function convertDbStatusToDisplay(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'Awaiting_QC': 'Awaiting QC',
    'Processing': 'Processing',
    'Receiving': 'Receiving',
    'Preparing_for_Dispatch': 'Preparing for Dispatch',
    'Ready_for_Dispatch': 'Ready for Dispatch',
    'In_Transit': 'In-Transit',
    'Delayed': 'Delayed',
    'Delivered': 'Delivered'
  };
  
  return statusMap[dbStatus] || dbStatus.replace(/_/g, ' ');
}