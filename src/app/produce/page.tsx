
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { produceData, shipmentData } from '@/lib/data';
import type { Produce } from '@/lib/data';
import { ProduceDataTable } from '@/components/dashboard/produce-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateProduceForm } from '@/components/dashboard/create-produce-form';
import { PlusCircle, Leaf, Weight, Truck } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';

export default function ProducePage() {
  const [produce, setProduce] = useState<Produce[]>(produceData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleAddProduce = (newProduce: Omit<Produce, 'id' | 'weightInProcessing' | 'weightIncoming' | 'shipmentCount'>) => {
    const newProduceWithDefaults: Produce = {
      ...newProduce,
      id: `prod-${Date.now()}`,
      weightInProcessing: 0,
      weightIncoming: 0,
      shipmentCount: 0,
    };
    setProduce(prev => [newProduceWithDefaults, ...prev]);
    setIsDialogOpen(false);
  };

  const formatTotalWeight = (weight: number) => {
    if (weight < 1000) return `${weight.toFixed(0)} kg`;
    return `${(weight / 1000).toFixed(1)} t`;
  }

  const totalProduceTypes = produce.length;
  const totalWeightInProcessing = produce.reduce((acc, p) => acc + p.weightInProcessing, 0);
  const totalWeightIncoming = produce.reduce((acc, p) => acc + p.weightIncoming, 0);
  
  const produceTypesOverview = {
    title: 'Produce Types',
    value: String(totalProduceTypes),
    change: 'in catalog',
    changeType: 'increase' as const,
  };

  const processingWeightOverview = {
    title: 'Total in Cold Room',
    value: formatTotalWeight(totalWeightInProcessing),
    change: 'across all locations',
    changeType: 'increase' as const,
  };

  const incomingWeightOverview = {
    title: 'Total Incoming',
    value: formatTotalWeight(totalWeightIncoming),
    change: 'across all shipments',
    changeType: 'increase' as const,
  };


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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Produce Management
                    </h2>
                    <p className="text-muted-foreground">
                        View, add, and manage your produce catalog.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add Produce
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Add New Produce</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new produce type to the system.
                        </DialogDescription>
                        </DialogHeader>
                        <CreateProduceForm onSubmit={handleAddProduce} />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <OverviewCard data={produceTypesOverview} icon={Leaf} />
              <OverviewCard data={processingWeightOverview} icon={Weight} />
              <OverviewCard data={incomingWeightOverview} icon={Truck} />
            </div>
          <ProduceDataTable produce={produce} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
