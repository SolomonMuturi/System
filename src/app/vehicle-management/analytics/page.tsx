

'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { vehicleTurnaroundData, fleetActivityData } from '@/lib/data';
import { VehicleTurnaroundChart } from '@/components/dashboard/vehicle-turnaround-chart';
import { FleetActivityChart } from '@/components/dashboard/fleet-activity-chart';

export default function VehicleAnalyticsPage() {
    const router = useRouter();

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <FreshViewLogo className="w-8 h-8 text-primary" />
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
                    <div className="mb-6">
                        <Button variant="outline" onClick={() => router.back()} className="mb-4">
                            <ArrowLeft className="mr-2" />
                            Back to Vehicle Management
                        </Button>
                        <h2 className="text-2xl font-bold tracking-tight">
                            VMS Analytics Dashboard
                        </h2>
                        <p className="text-muted-foreground">
                            Insights into your fleet's performance and efficiency.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FleetActivityChart data={fleetActivityData} />
                        <VehicleTurnaroundChart data={vehicleTurnaroundData} />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
