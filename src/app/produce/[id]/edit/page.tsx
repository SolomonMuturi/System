
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { produceData } from '@/lib/data';
import type { Produce } from '@/lib/data';
import { CreateProduceForm } from '@/components/dashboard/create-produce-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EditProducePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const produceId = params.id as string;

  const [produceItem, setProduceItem] = useState<Produce | null>(null);

  useEffect(() => {
    const item = produceData.find(p => p.id === produceId);
    if (item) {
      setProduceItem(item);
    }
  }, [produceId]);

  const handleUpdateProduce = (updatedProduce: Omit<Produce, 'id' | 'weightInProcessing' | 'weightIncoming' | 'shipmentCount'>) => {
    // In a real app, this would be an API call
    toast({
      title: 'Produce Updated',
      description: `${updatedProduce.name} has been successfully updated.`,
    });
    router.push('/produce');
  };

  if (!produceItem) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader><FreshViewLogo className="w-8 h-8 text-primary" /></SidebarHeader>
          <SidebarContent><SidebarNav /></SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-6">
            <p>Loading produce details...</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
            <div className="max-w-xl mx-auto">
                <div className="mb-6">
                    <Button variant="outline" onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="mr-2" />
                        Back to Produce
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Edit Produce: {produceItem.name}
                    </h2>
                    <p className="text-muted-foreground">
                        Update the details for this produce type.
                    </p>
                </div>
                <CreateProduceForm 
                    onSubmit={handleUpdateProduce}
                    produce={produceItem}
                />
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
