
'use client';

import { useParams } from 'next/navigation';
import { traceabilityData, type ShipmentDetails, shipmentData } from '@/lib/data';
import { ShipmentTimeline } from '@/components/dashboard/shipment-timeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FreshViewLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShipmentDetailsPage() {
  const params = useParams();
  const shipmentId = params.id as string;

  // In a real app, you would fetch this data based on the ID.
  // For this prototype, we'll use the static traceabilityData if the ID matches.
  const shipment = shipmentData.find(s => s.id === shipmentId);
  const shipmentHistory: ShipmentDetails = {
      ...traceabilityData,
      shipmentId: shipment?.shipmentId || 'N/A',
  };

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <FreshViewLogo className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Shipment Not Found</h1>
        <p className="text-muted-foreground mb-6">The shipment you are looking for does not exist or has been moved.</p>
        <Button asChild>
            <Link href="/">
                <ArrowLeft className="mr-2" />
                Back to Dashboard
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="bg-background border-b p-4">
            <div className="container mx-auto flex items-center gap-4">
                <FreshViewLogo className="w-8 h-8 text-primary" />
                <h1 className="text-xl font-headline font-bold text-foreground">
                Harir International - Shipment Tracking
                </h1>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Tracking Details</CardTitle>
                    <CardDescription>
                        Status and history for shipment <span className="font-mono font-bold">{shipment.shipmentId}</span> from <span className="font-bold">{shipment.origin}</span> to <span className="font-bold">{shipment.destination}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ShipmentTimeline shipment={shipmentHistory} />
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
