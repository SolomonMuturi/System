// /api/outbound-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching comprehensive outbound statistics...');
    
    // Get all counts from database
    const [
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
      uniqueCustomers
    ] = await Promise.all([
      // Loading sheets counts
      prisma.loading_sheets.count(),
      
      prisma.loading_sheets.count({
        where: {
          container: { not: null }
        }
      }),
      
      // Carrier counts
      prisma.carriers.count({
        where: {
          status: 'Active'
        }
      }),
      
      // Assignment counts (if you have assignments table)
      prisma.carrier_assignments.count().catch(() => 0),
      
      // Pending assignments
      prisma.carrier_assignments.count({
        where: {
          status: 'assigned'
        }
      }).catch(() => 0),
      
      // Completed assignments
      prisma.carrier_assignments.count({
        where: {
          status: 'completed'
        }
      }).catch(() => 0),
      
      // Shipment counts
      prisma.shipments.count(),
      
      // Active shipments (Preparing_for_Dispatch, Ready_for_Dispatch, In_Transit)
      prisma.shipments.count({
        where: {
          status: {
            in: ['Preparing_for_Dispatch', 'Ready_for_Dispatch', 'In_Transit']
          }
        }
      }),
      
      // Delayed shipments
      prisma.shipments.count({
        where: {
          status: 'Delayed'
        }
      }),
      
      // Delivered shipments
      prisma.shipments.count({
        where: {
          status: 'Delivered'
        }
      }),
      
      // Unique customers from shipments
      prisma.shipments.groupBy({
        by: ['customer_id'],
        _count: true
      }).then(results => results.length).catch(() => 0)
    ]);
    
    // Get status distribution
    const statusDistribution = await prisma.shipments.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    }).catch(() => []);
    
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
      statusDistribution: statusDistribution.reduce((acc: any, item) => {
        const status = convertDbStatusToDisplay(item.status);
        acc[status] = item._count._all;
        return acc;
      }, {})
    };
    
    console.log('✅ Comprehensive outbound stats fetched:', {
      totalLoadingSheets: stats.totalLoadingSheets,
      totalShipments: stats.totalShipments,
      activeCarriers: stats.activeCarriers
    });
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching outbound stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch statistics',
        details: error.message 
      },
      { status: 500 }
    );
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