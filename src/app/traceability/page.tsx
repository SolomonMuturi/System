'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { traceabilityData, type ShipmentDetails, shipmentData } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ShipmentTimeline } from '@/components/dashboard/shipment-timeline';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

export default function TraceabilityPage() {
  const searchParams = useSearchParams();
  const [shipmentId, setShipmentId] = useState(searchParams.get('shipmentId') || '');
  const [currentShipment, setCurrentShipment] = useState<ShipmentDetails | null>(null);

  useEffect(() => {
    if (shipmentId) {
      // In a real app, you'd fetch this. Here we simulate it.
      if (shipmentId === traceabilityData.shipmentId || shipmentData.some(s => s.shipmentId === shipmentId)) {
        setCurrentShipment(traceabilityData);
      } else {
        setCurrentShipment(null);
      }
    } else {
      setCurrentShipment(null);
    }
  }, [shipmentId]);


  const ShipmentMap = useMemo(
    () =>
      dynamic(() => import('@/components/dashboard/shipment-map'), {
        ssr: false,
        loading: () => <Skeleton className="h-full w-full" />,
      }),
    []
  );

  const originCoords: [number, number] = [0.2827, 36.0712]; // Nakuru, Kenya
  const destCoords: [number, number] = [-1.286389, 36.817223]; // Nairobi, Kenya
  const route: [number, number][] = [originCoords, destCoords];

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading traceability...</div>}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                Harir International
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                          Shipment Traceability
                      </h2>
                      <p className="text-muted-foreground">
                          Track and trace shipments from origin to destination.
                      </p>
                  </div>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                      <Input 
                        type="text" 
                        placeholder="Enter Shipment ID (e.g., SH-88120)" 
                        value={shipmentId}
                        onChange={(e) => setShipmentId(e.target.value)}
                      />
                      <Button type="submit">
                          <Search className="mr-2 h-4 w-4" />
                          Track
                      </Button>
                  </div>
              </div>
              
              {currentShipment ? (
                <div className="grid gap-6 md:gap-8 grid-cols-12">
                    <div className="col-span-12 lg:col-span-4">
                        <ShipmentTimeline shipment={currentShipment} />
                    </div>
                    <div className="col-span-12 lg:col-span-8">
                        <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Route Overview</CardTitle>
                            <CardDescription>
                            From{' '}
                            <span className="font-medium text-primary">{currentShipment.origin}</span>{' '}
                            to{' '}
                            <span className="font-medium text-primary">
                                {currentShipment.destination}
                            </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
                            <ShipmentMap
                                origin={originCoords}
                                destination={destCoords}
                                route={route}
                            />
                            </div>
                        </CardContent>
                        </Card>
                    </div>
                </div>
              ) : (
                <Card className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">Enter a Shipment ID to see tracking details.</p>
                </Card>
              )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  );
}