// app/warehouse/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  HardHat, Scale, Package, Truck, ChevronDown, CheckCircle, 
  RefreshCw, Calculator, Box, History, Search, Calendar, Filter, X, 
  BarChart3, Users, PackageOpen, TrendingUp, AlertTriangle, Check,
  Download, FileSpreadsheet, ChevronRight, Phone, Banknote, CreditCard,
  FileText, ClipboardList, Printer, FileDown, Eye, EyeOff, Info,
  Wallet, Smartphone, Building, Fingerprint, Apple, PieChart,
  Grid3x3, Layers, BarChart, Table as TableIcon, Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CountingFormData } from '@/types/counting';
import { format, isSameDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SupplierIntakeRecord {
  id: string;
  pallet_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  total_weight: number;
  fuerte_weight: number;
  hass_weight: number;
  fuerte_crates: number;
  hass_crates: number;
  fruit_varieties: Array<{
    name: string;
    weight: number;
    crates: number;
  }>;
  region: string;
  timestamp: string;
  status: 'processed' | 'pending' | 'rejected';
  supplier_phone?: string;
  bank_name?: string;
  bank_account?: string;
  kra_pin?: string;
}

interface QualityCheck {
  id: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_name: string;
  overall_status: 'approved' | 'rejected';
  processed_at: string;
  fuerte_class1: number;
  fuerte_class2: number;
  fuerte_overall: number;
  hass_class1: number;
  hass_class2: number;
  hass_overall: number;
  rejected_weight?: number;
}

interface CountingStats {
  total_processed: number;
  pending_coldroom: number;
  total_suppliers: number;
  fuerte_4kg: number;
  fuerte_10kg: number;
  hass_4kg: number;
  hass_10kg: number;
  recent_activity: {
    last_7_days: number;
    last_30_days: number;
  };
  weight_summary?: {
    total_intake_weight: number;
    total_counted_weight: number;
    total_rejected_weight: number;
    fuerte_total_weight: number;
    hass_total_weight: number;
  };
}

interface CountingRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  pallet_id: string;
  region: string;
  total_weight: number;
  total_counted_weight: number;
  rejected_weight?: number;
  rejection_reason?: string;
  rejection_notes?: string;
  fuerte_4kg_total: number;
  fuerte_10kg_total: number;
  hass_4kg_total: number;
  hass_10kg_total: number;
  counting_data: any;
  totals: any;
  status: string;
  for_coldroom: boolean;
  submitted_at: string;
  processed_by: string;
  notes?: string;
  driver_name?: string;
  vehicle_plate?: string;
  supplier_phone?: string;
  bank_name?: string;
  bank_account?: string;
  kra_pin?: string;
  fuerte_4kg_class1?: number;
  fuerte_4kg_class2?: number;
  fuerte_10kg_class1?: number;
  fuerte_10kg_class2?: number;
  hass_4kg_class1?: number;
  hass_4kg_class2?: number;
  hass_10kg_class1?: number;
  hass_10kg_class2?: number;
}

interface CSVRow {
  date: string;
  supplier_name: string;
  region: string;
  pallet_id: string;
  driver_name: string;
  vehicle_plate: string;
  intake_weight_kg: number;
  counted_weight_kg: number;
  rejected_weight_kg: number;
  weight_variance_kg: number;
  fuerte_4kg_boxes: number;
  fuerte_10kg_crates: number;
  hass_4kg_boxes: number;
  hass_10kg_crates: number;
  total_boxes: number;
  processed_by: string;
  notes: string;
  rejection_reason?: string;
}

interface SupplierDetails {
  weight_entry: any;
  supplier: any;
  quality_check: any;
  payment_details: {
    phone_number: string;
    bank_name: string;
    bank_account: string;
    kra_pin: string;
  };
}

interface WeightEntry {
  id: string;
  fuerte_weight: number;
  hass_weight: number;
  fuerte_crates: number;
  hass_crates: number;
  product?: string;
  fruit_variety?: string[];
  supplier: string;
  region: string;
  timestamp: string;
  pallet_id: string;
}

interface SizeStats {
  variety: 'fuerte' | 'hass';
  boxType: '4kg' | '10kg';
  classType: 'class1' | 'class2';
  size: string;
  count: number;
}

interface VarietySizeStats {
  variety: 'fuerte' | 'hass';
  boxType: '4kg' | '10kg';
  size12_class1: number;
  size12_class2: number;
  size14_class1: number;
  size14_class2: number;
  size16_class1: number;
  size16_class2: number;
  size18_class1: number;
  size18_class2: number;
  size20_class1: number;
  size20_class2: number;
  size22_class1: number;
  size22_class2: number;
  size24_class1: number;
  size24_class2: number;
  size26_class1: number;
  size26_class2: number;
  size28_class1?: number;
  size28_class2?: number;
  size30_class1?: number;
  size30_class2?: number;
  size32_class1?: number;
  size32_class2?: number;
}

interface RejectionEntry {
  id?: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  region: string;
  fuerte_weight: number;
  fuerte_crates: number;
  hass_weight: number;
  hass_crates: number;
  total_rejected_weight: number;
  total_rejected_crates: number;
  counted_weight: number;
  variance: number;
  reason?: string;
  notes?: string;
  rejected_at: string;
  created_by: string;
}

// Safe clipboard copy function with fallback
const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
    
    // Modern clipboard API
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('Clipboard copy failed:', error);
    return false;
  }
};

const extractFruitVarieties = (entry: any): Array<{name: string, weight: number, crates: number}> => {
  const varieties: Array<{name: string, weight: number, crates: number}> = [];
  
  const parseNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };
  
  const fuerteWeight = parseNumber(entry.fuerte_weight);
  const hassWeight = parseNumber(entry.hass_weight);
  const fuerteCrates = parseNumber(entry.fuerte_crates);
  const hassCrates = parseNumber(entry.hass_crates);
  
  if (fuerteWeight > 0) {
    varieties.push({
      name: 'Fuerte',
      weight: fuerteWeight,
      crates: fuerteCrates
    });
  }
  
  if (hassWeight > 0) {
    varieties.push({
      name: 'Hass',
      weight: hassWeight,
      crates: hassCrates
    });
  }
  
  if (entry.fruit_varieties && Array.isArray(entry.fruit_varieties)) {
    entry.fruit_varieties.forEach((variety: any) => {
      if (variety && typeof variety === 'object') {
        const weight = parseNumber(variety.weight);
        if (weight > 0) {
          varieties.push({
            name: variety.name || 'Unknown Variety',
            weight: weight,
            crates: parseNumber(variety.crates)
          });
        }
      } else if (typeof variety === 'string') {
        const match = variety.match(/(\w+):\s*(\d+(?:\.\d+)?)/i);
        if (match) {
          varieties.push({
            name: match[1],
            weight: parseNumber(match[2]),
            crates: 0
          });
        }
      }
    });
  }
  
  if (!varieties.length && entry.product) {
    const totalWeight = parseNumber(entry.total_weight || entry.fuerte_weight || entry.hass_weight);
    if (totalWeight > 0) {
      varieties.push({
        name: entry.product,
        weight: totalWeight,
        crates: parseNumber(entry.fuerte_crates || entry.hass_crates)
      });
    }
  }
  
  if (!varieties.length) {
    const totalWeight = parseNumber(entry.total_weight);
    if (totalWeight > 0) {
      varieties.push({
        name: 'Avocado',
        weight: totalWeight,
        crates: 0
      });
    }
  }
  
  return varieties;
};

const processingStages = [
  { id: 'intake', name: 'Intake', icon: Truck, description: 'Supplier intake & initial check-in.', tag: 'Pallet ID' },
  { id: 'quality', name: 'Quality Control', icon: Scale, description: 'Quality assessment and packability checks.', tag: 'QC Assessment' },
  { id: 'counting', name: 'Counting', icon: Calculator, description: 'Box counting and size classification.', tag: 'Box Count Form' },
  { id: 'history', name: 'History', icon: History, description: 'Completed processing records.', tag: 'Finalized' },
  { id: 'statistics', name: 'Statistics', icon: PieChart, description: 'Detailed box size statistics.', tag: 'Analytics' },
];

const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value);
  return isNaN(num) ? '0.'.padEnd(decimals + 2, '0') : num.toFixed(decimals);
};

const safeArray = <T,>(array: T[] | undefined | null): T[] => {
  return Array.isArray(array) ? array : [];
};

const parseCountingTotals = (countingTotals: any): any => {
  if (!countingTotals) return {};
  
  if (typeof countingTotals === 'string') {
    try {
      return JSON.parse(countingTotals);
    } catch (e) {
      console.error('Error parsing counting_totals:', e);
      return {};
    }
  }
  
  if (typeof countingTotals === 'object') {
    return countingTotals;
  }
  
  return {};
};

const getTotalBoxesFromCountingTotals = (countingTotals: any): number => {
  const totals = parseCountingTotals(countingTotals);
  
  const fuerte4kg = totals.fuerte_4kg_total || 0;
  const fuerte10kg = totals.fuerte_10kg_total || 0;
  const hass4kg = totals.hass_4kg_total || 0;
  const hass10kg = totals.hass_10kg_total || 0;
  
  return fuerte4kg + fuerte10kg + hass4kg + hass10kg;
};

const getBoxesSummary = (countingTotals: any): { 
  fuerte_4kg: number; 
  fuerte_10kg: number; 
  hass_4kg: number; 
  hass_10kg: number;
  total: number;
} => {
  const totals = parseCountingTotals(countingTotals);
  
  const fuerte_4kg = totals.fuerte_4kg_total || 0;
  const fuerte_10kg = totals.fuerte_10kg_total || 0;
  const hass_4kg = totals.hass_4kg_total || 0;
  const hass_10kg = totals.hass_10kg_total || 0;
  const total = fuerte_4kg + fuerte_10kg + hass_4kg + hass_10kg;
  
  return { fuerte_4kg, fuerte_10kg, hass_4kg, hass_10kg, total };
};

const getSupplierInfoFromCountingData = (countingData: any) => {
  if (!countingData) return { driver_name: '', vehicle_plate: '' };
  
  if (typeof countingData === 'string') {
    try {
      const parsed = JSON.parse(countingData);
      return {
        driver_name: parsed.driver_name || '',
        vehicle_plate: parsed.vehicle_plate || ''
      };
    } catch (e) {
      return { driver_name: '', vehicle_plate: '' };
    }
  }
  
  return {
    driver_name: countingData.driver_name || '',
    vehicle_plate: countingData.vehicle_plate || ''
  };
};

const isSupplierCounted = (supplierId: string, countingRecords: CountingRecord[]): boolean => {
  return countingRecords.some(record => record.supplier_id === supplierId);
};

const generateWarehouseGRN = async (record: CountingRecord) => {
  try {
    const countingData = record.counting_data || {};
    const totals = record.totals || {};
    const today = new Date();
    
    const doc = new jsPDF('p', 'mm', 'a4');
    
    let hasLogo = false;
    let logoHeight = 0;
    
    try {
      const logoPaths = [
        '/Harirlogo.svg',
        '/Harirlogo.png',
        '/Harirlogo.jpg',
        '/logo.png',
        '/logo.jpg',
       '/favicon.ico'
      ];
      
      for (const path of logoPaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const blob = await response.blob();
            const base64String = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            
            doc.addImage(base64String as string, 'PNG', 91, 6, 18, 18);
            hasLogo = true;
            logoHeight = 18;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.log('Logo loading failed:', error);
    }
    
    if (!hasLogo) {
      doc.setFillColor(34, 139, 34);
      doc.circle(100, 15, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('HI', 100, 18, { align: 'center' });
      logoHeight = 16;
    }
    
    const startY = 30;
    doc.setTextColor(34, 139, 34);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HARIR INTERNATIONAL', 105, startY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('FRESH PRODUCE EXPORTER', 105, startY + 6, { align: 'center' });
    
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(10, startY + 10, 200, startY + 10);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GOODS RECEIVED NOTE - BOX COUNTING', 105, startY + 18, { align: 'center' });
    
    let yPos = startY + 26;
    
    // Document Details
    doc.setFillColor(248, 249, 250);
    doc.rect(10, yPos, 190, 12, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Details', 15, yPos + 5);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`GRN: WH-${record.id.slice(0, 8).toUpperCase()}`, 15, yPos + 10);
    doc.text(`Date: ${format(new Date(record.submitted_at), 'dd/MM/yyyy')}`, 60, yPos + 10);
    doc.text(`Time: ${format(new Date(record.submitted_at), 'HH:mm')}`, 100, yPos + 10);
    doc.text(`By: ${record.processed_by}`, 140, yPos + 10);
    
    yPos += 16;
    
    // Supplier Information
    doc.setFillColor(233, 236, 239);
    doc.rect(10, yPos, 190, 20, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier Information', 15, yPos + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Supplier: ${record.supplier_name}`, 15, yPos + 11);
    doc.text(`Phone: ${record.supplier_phone || 'N/A'}`, 80, yPos + 11);
    doc.text(`Driver: ${record.driver_name || 'N/A'}`, 140, yPos + 11);
    
    doc.text(`Pallet: ${record.pallet_id}`, 15, yPos + 17);
    doc.text(`Region: ${record.region}`, 80, yPos + 17);
    doc.text(`Vehicle: ${record.vehicle_plate || 'N/A'}`, 140, yPos + 17);
    
    yPos += 24;
    
    // Weight Summary with Rejected Weight
    doc.setFillColor(220, 252, 231);
    doc.rect(10, yPos, 190, 15, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Weight Summary (kg)', 15, yPos + 5);
    
    const fuerte4kgWeight = (record.fuerte_4kg_total || 0) * 4;
    const fuerte10kgWeight = (record.fuerte_10kg_total || 0) * 10;
    const hass4kgWeight = (record.hass_4kg_total || 0) * 4;
    const hass10kgWeight = (record.hass_10kg_total || 0) * 10;
    const totalFuerteWeight = fuerte4kgWeight + fuerte10kgWeight;
    const totalHassWeight = hass4kgWeight + hass10kgWeight;
    const rejectedWeight = record.rejected_weight || 0;
    const totalCountedWeight = totalFuerteWeight + totalHassWeight;
    const intakeWeight = record.total_weight;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Intake: ${safeToFixed(intakeWeight, 2)} kg`, 15, yPos + 10);
    doc.text(`Counted: ${safeToFixed(totalCountedWeight, 2)} kg`, 80, yPos + 10);
    doc.text(`Rejected: ${safeToFixed(rejectedWeight, 2)} kg`, 140, yPos + 10);
    
    yPos += 24;
    
    if (rejectedWeight > 0) {
      doc.setFillColor(255, 243, 243);
      doc.rect(10, yPos, 190, 15, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('REJECTED WEIGHT', 15, yPos + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      
      const rejectionPercentage = ((rejectedWeight / intakeWeight) * 100).toFixed(1);
      doc.text(`Total Rejected: ${safeToFixed(rejectedWeight, 2)} kg (${rejectionPercentage}% of intake)`, 15, yPos + 12);
      
      if (record.rejection_reason) {
        doc.text(`Reason: ${record.rejection_reason}`, 15, yPos + 17);
      }
      
      if (record.rejection_notes) {
        doc.text(`Notes: ${record.rejection_notes}`, 15, yPos + 22);
      }
      
      yPos += 30;
    }
    
    doc.setFillColor(52, 58, 64);
    doc.rect(10, yPos, 190, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DETAILED BOX SIZE COUNTS', 15, yPos + 5.5);
    
    yPos += 15;
    
    const getSizeCounts = (prefix: string, boxType: string) => {
      const sizes = boxType === '4kg' 
        ? ['12', '14', '16', '18', '20', '22', '24', '26']
        : ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
      
      const sizeData: Array<{
        size: string;
        class1: number;
        class2: number;
      }> = [];
      
      for (const size of sizes) {
        const class1Key = `${prefix}_${boxType}_class1_size${size}`;
        const class2Key = `${prefix}_${boxType}_class2_size${size}`;
        const class1 = countingData[class1Key] || 0;
        const class2 = countingData[class2Key] || 0;
        
        if (class1 > 0 || class2 > 0) {
          sizeData.push({ size, class1, class2 });
        }
      }
      
      return sizeData;
    };

    const fuerte4kgSizes = getSizeCounts('fuerte', '4kg');
    const fuerte10kgSizes = getSizeCounts('fuerte', '10kg');
    const hass4kgSizes = getSizeCounts('hass', '4kg');
    const hass10kgSizes = getSizeCounts('hass', '10kg');
    
    const hasFuerte = fuerte4kgSizes.length > 0 || fuerte10kgSizes.length > 0;
    const hasHass = hass4kgSizes.length > 0 || hass10kgSizes.length > 0;
    
    const tableWidth = hasFuerte && hasHass ? 90 : 190;
    const leftMargin = 10;
    const rightMargin = hasFuerte && hasHass ? leftMargin + tableWidth + 5 : leftMargin;
    
    // Fuerte Tables
    let leftY = yPos;
    
    if (hasFuerte) {
      if (!hasHass) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text('FUERTE AVOCADO - SIZE BREAKDOWN', 105, leftY - 2, { align: 'center' });
      }
      
      if (fuerte4kgSizes.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text('Fuerte 4kg Boxes - Size Breakdown:', leftMargin, leftY);
        
        leftY += 3;
        
        autoTable(doc, {
          startY: leftY,
          margin: { left: leftMargin, right: hasFuerte && hasHass ? leftMargin + tableWidth : 20 },
          head: [['Size', 'Class 1', 'Class 2']],
          body: fuerte4kgSizes.map(s => [
            `Size ${s.size}`,
            s.class1.toString(),
            s.class2.toString()
          ]),
          theme: 'grid',
          headStyles: { 
            fillColor: [22, 101, 52],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 2,
            textColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: hasFuerte && hasHass ? 25 : 35 },
            1: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' },
            2: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' }
          },
          tableWidth: tableWidth
        });
        
        leftY = (doc as any).lastAutoTable.finalY + 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Fuerte 4kg: ${record.fuerte_4kg_total || 0} boxes`, leftMargin, leftY);
        leftY += 8;
      }

      if (fuerte10kgSizes.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text('Fuerte 10kg Crates - Size Breakdown:', leftMargin, leftY);
        
        leftY += 3;
        
        autoTable(doc, {
          startY: leftY,
          margin: { left: leftMargin, right: hasFuerte && hasHass ? leftMargin + tableWidth : 20 },
          head: [['Size', 'Class 1', 'Class 2']],
          body: fuerte10kgSizes.map(s => [
            `Size ${s.size}`,
            s.class1.toString(),
            s.class2.toString()
          ]),
          theme: 'grid',
          headStyles: { 
            fillColor: [22, 101, 52],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 2,
            textColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: hasFuerte && hasHass ? 25 : 35 },
            1: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' },
            2: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' }
          },
          tableWidth: tableWidth
        });
        
        leftY = (doc as any).lastAutoTable.finalY + 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Fuerte 10kg: ${record.fuerte_10kg_total || 0} crates`, leftMargin, leftY);
        leftY += 8;
      }
      
      if (!hasHass) {
        yPos = leftY;
      }
    }

    // Hass Tables
    let rightY = yPos;
    
    if (hasHass) {
      if (!hasFuerte) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(124, 58, 237);
        doc.text('HASS AVOCADO - SIZE BREAKDOWN', 105, rightY - 2, { align: 'center' });
      }
      
      if (hass4kgSizes.length > 0) {
        if (hasFuerte && hasHass) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(124, 58, 237);
          doc.text('Hass 4kg Boxes - Size Breakdown:', rightMargin, rightY);
        }
        
        rightY += 3;
        
        autoTable(doc, {
          startY: rightY,
          margin: { left: hasFuerte && hasHass ? rightMargin : 10, right: 20 },
          head: [['Size', 'Class 1', 'Class 2']],
          body: hass4kgSizes.map(s => [
            `Size ${s.size}`,
            s.class1.toString(),
            s.class2.toString()
          ]),
          theme: 'grid',
          headStyles: { 
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 2,
            textColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: hasFuerte && hasHass ? 25 : 35 },
            1: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' },
            2: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' }
          },
          tableWidth: hasFuerte && hasHass ? 90 : 190
        });
        
        rightY = (doc as any).lastAutoTable.finalY + 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Hass 4kg: ${record.hass_4kg_total || 0} boxes`, hasFuerte && hasHass ? rightMargin : 10, rightY);
        rightY += 8;
      }

      if (hass10kgSizes.length > 0) {
        if (hasFuerte && hasHass) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(124, 58, 237);
          doc.text('Hass 10kg Crates - Size Breakdown:', rightMargin, rightY);
        }
        
        rightY += 3;
        
        autoTable(doc, {
          startY: rightY,
          margin: { left: hasFuerte && hasHass ? rightMargin : 10, right: 20 },
          head: [['Size', 'Class 1', 'Class 2']],
          body: hass10kgSizes.map(s => [
            `Size ${s.size}`,
            s.class1.toString(),
            s.class2.toString()
          ]),
          theme: 'grid',
          headStyles: { 
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 2,
            textColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: hasFuerte && hasHass ? 25 : 35 },
            1: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' },
            2: { cellWidth: hasFuerte && hasHass ? 20 : 30, halign: 'center' }
          },
          tableWidth: hasFuerte && hasHass ? 90 : 190
        });
        
        rightY = (doc as any).lastAutoTable.finalY + 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Hass 10kg: ${record.hass_10kg_total || 0} crates`, hasFuerte && hasHass ? rightMargin : 10, rightY);
        rightY += 8;
      }
    }
    
    yPos = Math.max(leftY, rightY) + 5;
    
    if (record.bank_name || record.bank_account || record.kra_pin) {
      doc.setFillColor(249, 250, 251);
      doc.rect(10, yPos, 190, 15, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Payment Information', 15, yPos + 6);
      
      doc.setFont('helvetica', 'normal');
      
      if (record.bank_name) doc.text(`Bank: ${record.bank_name}`, 15, yPos + 12);
      if (record.bank_account) doc.text(`Account: ${record.bank_account}`, 80, yPos + 12);
      if (record.kra_pin) doc.text(`KRA PIN: ${record.kra_pin}`, 140, yPos + 12);
      
      yPos += 20;
    }
    
    if (record.notes && record.notes.trim() !== '') {
      doc.setFillColor(255, 248, 225);
      doc.rect(10, yPos, 190, 15, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Notes', 15, yPos + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      const notes = record.notes;
      const maxLength = 100;
      let notesY = yPos + 12;
      
      for (let i = 0; i < notes.length; i += maxLength) {
        const line = notes.substring(i, Math.min(i + maxLength, notes.length));
        doc.text(line, 15, notesY);
        notesY += 3;
      }
      
      yPos = notesY + 5;
    }
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    
    doc.line(20, yPos, 90, yPos);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Counting Clerk', 55, yPos + 3, { align: 'center' });
    doc.text('Name & Signature', 55, yPos + 6, { align: 'center' });
    
    doc.line(120, yPos, 190, yPos);
    doc.text('Warehouse Receiver', 155, yPos + 3, { align: 'center' });
    doc.text('Name & Signature', 155, yPos + 6, { align: 'center' });
    
    yPos += 12;
    
    doc.setFontSize(6);
    doc.setTextColor(128, 128, 128);
    doc.text('Harir International - Warehouse Counting System', 105, yPos, { align: 'center' });
    doc.text(`Document: WH-GRN-${record.id.slice(0, 8).toUpperCase()} • Generated: ${format(today, 'dd/MM/yyyy HH:mm:ss')}`, 105, yPos + 3, { align: 'center' });
    doc.text('This is a computer-generated document', 105, yPos + 6, { align: 'center' });
    
    const fileName = `Warehouse_GRN_${record.supplier_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error: any) {
    console.error('Error generating warehouse GRN:', error);
    throw error;
  }
};

export default function WarehousePage() {
  const { toast } = useToast();
  const [supplierIntakeRecords, setSupplierIntakeRecords] = useState<SupplierIntakeRecord[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [countingRecords, setCountingRecords] = useState<CountingRecord[]>([]);
  const [rejects, setRejects] = useState<RejectionEntry[]>([]);
  const [stats, setStats] = useState<CountingStats>({
    total_processed: 0,
    pending_coldroom: 0,
    total_suppliers: 0,
    fuerte_4kg: 0,
    fuerte_10kg: 0,
    hass_4kg: 0,
    hass_10kg: 0,
    recent_activity: {
      last_7_days: 0,
      last_30_days: 0,
    },
  });
  const [isLoading, setIsLoading] = useState({ 
    intake: true, 
    quality: true, 
    counting: false,
    stats: false,
    supplierDetails: false,
    rejects: false
  });
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expandedIntake, setExpandedIntake] = useState<Set<string>>(new Set());
  const [expandedQuality, setExpandedQuality] = useState<Set<string>>(new Set());
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierIntakeRecord | null>(null);
  const [selectedQC, setSelectedQC] = useState<QualityCheck | null>(null);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState<SupplierDetails | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('intake');
  
  const [countingForm, setCountingForm] = useState<CountingFormData>({
    supplier_id: '',
    supplier_name: '',
    supplier_phone: '',
    region: '',
    fruits: [],
    fuerte_4kg_class1_size12: 0,
    fuerte_4kg_class1_size14: 0,
    fuerte_4kg_class1_size16: 0,
    fuerte_4kg_class1_size18: 0,
    fuerte_4kg_class1_size20: 0,
    fuerte_4kg_class1_size22: 0,
    fuerte_4kg_class1_size24: 0,
    fuerte_4kg_class1_size26: 0,
    fuerte_4kg_class2_size12: 0,
    fuerte_4kg_class2_size14: 0,
    fuerte_4kg_class2_size16: 0,
    fuerte_4kg_class2_size18: 0,
    fuerte_4kg_class2_size20: 0,
    fuerte_4kg_class2_size22: 0,
    fuerte_4kg_class2_size24: 0,
    fuerte_4kg_class2_size26: 0,
    fuerte_10kg_class1_size12: 0,
    fuerte_10kg_class1_size14: 0,
    fuerte_10kg_class1_size16: 0,
    fuerte_10kg_class1_size18: 0,
    fuerte_10kg_class1_size20: 0,
    fuerte_10kg_class1_size22: 0,
    fuerte_10kg_class1_size24: 0,
    fuerte_10kg_class1_size26: 0,
    fuerte_10kg_class1_size28: 0,
    fuerte_10kg_class1_size30: 0,
    fuerte_10kg_class1_size32: 0,
    fuerte_10kg_class2_size12: 0,
    fuerte_10kg_class2_size14: 0,
    fuerte_10kg_class2_size16: 0,
    fuerte_10kg_class2_size18: 0,
    fuerte_10kg_class2_size20: 0,
    fuerte_10kg_class2_size22: 0,
    fuerte_10kg_class2_size24: 0,
    fuerte_10kg_class2_size26: 0,
    fuerte_10kg_class2_size28: 0,
    fuerte_10kg_class2_size30: 0,
    fuerte_10kg_class2_size32: 0,
    hass_4kg_class1_size12: 0,
    hass_4kg_class1_size14: 0,
    hass_4kg_class1_size16: 0,
    hass_4kg_class1_size18: 0,
    hass_4kg_class1_size20: 0,
    hass_4kg_class1_size22: 0,
    hass_4kg_class1_size24: 0,
    hass_4kg_class1_size26: 0,
    hass_4kg_class2_size12: 0,
    hass_4kg_class2_size14: 0,
    hass_4kg_class2_size16: 0,
    hass_4kg_class2_size18: 0,
    hass_4kg_class2_size20: 0,
    hass_4kg_class2_size22: 0,
    hass_4kg_class2_size24: 0,
    hass_4kg_class2_size26: 0,
    hass_10kg_class1_size12: 0,
    hass_10kg_class1_size14: 0,
    hass_10kg_class1_size16: 0,
    hass_10kg_class1_size18: 0,
    hass_10kg_class1_size20: 0,
    hass_10kg_class1_size22: 0,
    hass_10kg_class1_size24: 0,
    hass_10kg_class1_size26: 0,
    hass_10kg_class1_size28: 0,
    hass_10kg_class1_size30: 0,
    hass_10kg_class1_size32: 0,
    hass_10kg_class2_size12: 0,
    hass_10kg_class2_size14: 0,
    hass_10kg_class2_size16: 0,
    hass_10kg_class2_size18: 0,
    hass_10kg_class2_size20: 0,
    hass_10kg_class2_size22: 0,
    hass_10kg_class2_size24: 0,
    hass_10kg_class2_size26: 0,
    hass_10kg_class2_size28: 0,
    hass_10kg_class2_size30: 0,
    hass_10kg_class2_size32: 0,
    notes: '',
    bank_name: '',
    bank_account: '',
    kra_pin: '',
  });

  // NEW: State for editing existing counting record
  const [editingRecord, setEditingRecord] = useState<CountingRecord | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [expandedFuerteClass2, setExpandedFuerteClass2] = useState(false);
  const [expandedFuerte10kg, setExpandedFuerte10kg] = useState(false);
  const [expandedHassClass2, setExpandedHassClass2] = useState(false);
  const [expandedHass10kg, setExpandedHass10kg] = useState(false);

  const [sizeStatistics, setSizeStatistics] = useState<{
    fuerte: {
      '4kg': VarietySizeStats;
      '10kg': VarietySizeStats;
    };
    hass: {
      '4kg': VarietySizeStats;
      '10kg': VarietySizeStats;
    };
  }>({
    fuerte: {
      '4kg': {
        variety: 'fuerte',
        boxType: '4kg',
        size12_class1: 0,
        size12_class2: 0,
        size14_class1: 0,
        size14_class2: 0,
        size16_class1: 0,
        size16_class2: 0,
        size18_class1: 0,
        size18_class2: 0,
        size20_class1: 0,
        size20_class2: 0,
        size22_class1: 0,
        size22_class2: 0,
        size24_class1: 0,
        size24_class2: 0,
        size26_class1: 0,
        size26_class2: 0,
      },
      '10kg': {
        variety: 'fuerte',
        boxType: '10kg',
        size12_class1: 0,
        size12_class2: 0,
        size14_class1: 0,
        size14_class2: 0,
        size16_class1: 0,
        size16_class2: 0,
        size18_class1: 0,
        size18_class2: 0,
        size20_class1: 0,
        size20_class2: 0,
        size22_class1: 0,
        size22_class2: 0,
        size24_class1: 0,
        size24_class2: 0,
        size26_class1: 0,
        size26_class2: 0,
        size28_class1: 0,
        size28_class2: 0,
        size30_class1: 0,
        size30_class2: 0,
        size32_class1: 0,
        size32_class2: 0,
      }
    },
    hass: {
      '4kg': {
        variety: 'hass',
        boxType: '4kg',
        size12_class1: 0,
        size12_class2: 0,
        size14_class1: 0,
        size14_class2: 0,
        size16_class1: 0,
        size16_class2: 0,
        size18_class1: 0,
        size18_class2: 0,
        size20_class1: 0,
        size20_class2: 0,
        size22_class1: 0,
        size22_class2: 0,
        size24_class1: 0,
        size24_class2: 0,
        size26_class1: 0,
        size26_class2: 0,
      },
      '10kg': {
        variety: 'hass',
        boxType: '10kg',
        size12_class1: 0,
        size12_class2: 0,
        size14_class1: 0,
        size14_class2: 0,
        size16_class1: 0,
        size16_class2: 0,
        size18_class1: 0,
        size18_class2: 0,
        size20_class1: 0,
        size20_class2: 0,
        size22_class1: 0,
        size22_class2: 0,
        size24_class1: 0,
        size24_class2: 0,
        size26_class1: 0,
        size26_class2: 0,
        size28_class1: 0,
        size28_class2: 0,
        size30_class1: 0,
        size30_class2: 0,
        size32_class1: 0,
        size32_class2: 0,
      }
    }
  });

  const calculateStatsFromRecords = useCallback((records: CountingRecord[], rejections: RejectionEntry[]): CountingStats => {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    const filteredRecords = records.filter(record => 
      record.status === 'pending_coldroom' || record.status === 'completed'
    );

    // Get rejected weights from rejections
    const rejectionMap = new Map<string, number>();
    rejections.forEach(reject => {
      if (reject.weight_entry_id) {
        rejectionMap.set(reject.weight_entry_id, reject.total_rejected_weight || 0);
      }
    });

    const recentRecords = filteredRecords.filter(record => {
      const recordDate = new Date(record.submitted_at);
      return recordDate >= last30Days;
    });

    const last7DaysRecords = recentRecords.filter(record => {
      const recordDate = new Date(record.submitted_at);
      return recordDate >= last7Days;
    });

    // Calculate totals from all records
    const totalFuerte4kg = filteredRecords.reduce((sum, record) => sum + (record.fuerte_4kg_total || 0), 0);
    const totalFuerte10kg = filteredRecords.reduce((sum, record) => sum + (record.fuerte_10kg_total || 0), 0);
    const totalHass4kg = filteredRecords.reduce((sum, record) => sum + (record.hass_4kg_total || 0), 0);
    const totalHass10kg = filteredRecords.reduce((sum, record) => sum + (record.hass_10kg_total || 0), 0);

    // Calculate weight summary including rejected weight
    const totalIntakeWeight = filteredRecords.reduce((sum, record) => sum + (record.total_weight || 0), 0);
    const totalCountedWeight = filteredRecords.reduce((sum, record) => sum + (record.total_counted_weight || 0), 0);
    
    // Get rejected weight from both counting records and rejections API
    let totalRejectedWeight = filteredRecords.reduce((sum, record) => sum + (record.rejected_weight || 0), 0);
    
    // Add rejected weight from rejects API for records that don't have it
    filteredRecords.forEach(record => {
      const rejection = rejectionMap.get(record.id);
      if (rejection && (!record.rejected_weight || record.rejected_weight === 0)) {
        totalRejectedWeight += rejection;
      }
    });
    
    const fuerteTotalWeight = totalFuerte4kg * 4 + totalFuerte10kg * 10;
    const hassTotalWeight = totalHass4kg * 4 + totalHass10kg * 10;

    // Get unique suppliers
    const uniqueSuppliers = new Set(filteredRecords.map(record => record.supplier_name));
    
    // Count pending coldroom
    const pendingColdroom = records.filter(record => 
      record.status === 'pending_coldroom' && record.for_coldroom
    ).length;

    return {
      total_processed: filteredRecords.length,
      pending_coldroom: pendingColdroom,
      total_suppliers: uniqueSuppliers.size,
      fuerte_4kg: totalFuerte4kg,
      fuerte_10kg: totalFuerte10kg,
      hass_4kg: totalHass4kg,
      hass_10kg: totalHass10kg,
      recent_activity: {
        last_7_days: last7DaysRecords.length,
        last_30_days: recentRecords.length,
      },
      weight_summary: {
        total_intake_weight: totalIntakeWeight,
        total_counted_weight: totalCountedWeight,
        total_rejected_weight: totalRejectedWeight,
        fuerte_total_weight: fuerteTotalWeight,
        hass_total_weight: hassTotalWeight,
      }
    };
  }, []);

  const fetchRejects = async () => {
    try {
      setIsLoading(prev => ({ ...prev, rejects: true }));
      const response = await fetch('/api/rejects');
      
      if (response.ok) {
        const data: RejectionEntry[] = await response.json();
        setRejects(data);
        return data;
      } else {
        console.log('No rejects API or empty response');
        return [];
      }
    } catch (err: any) {
      console.error('Error fetching rejects:', err);
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, rejects: false }));
    }
  };

  const fetchIntakeRecords = async () => {
    try {
      setIsLoading(prev => ({ ...prev, intake: true }));
      const response = await fetch('/api/weights?limit=100&order=desc');
      if (!response.ok) throw new Error('Failed to fetch intake records');
      const weightEntries = await response.json();
      
      const intakeRecords: SupplierIntakeRecord[] = weightEntries.map((entry: any) => {
        const varieties = extractFruitVarieties(entry);
        
        return {
          id: entry.id,
          pallet_id: entry.pallet_id || `WE-${entry.id}`,
          supplier_name: entry.supplier || entry.supplier_name || 'Unknown Supplier',
          driver_name: entry.driver_name || '',
          vehicle_plate: entry.vehicle_plate || entry.truck_id || '',
          total_weight: (entry.fuerte_weight || 0) + (entry.hass_weight || 0),
          fuerte_weight: entry.fuerte_weight || 0,
          hass_weight: entry.hass_weight || 0,
          fuerte_crates: entry.fuerte_crates || 0,
          hass_crates: entry.hass_crates || 0,
          fruit_varieties: varieties,
          region: entry.region || '',
          timestamp: entry.timestamp || entry.created_at || new Date().toISOString(),
          status: 'processed',
          supplier_phone: entry.supplier_phone || '',
          bank_name: entry.bank_name || '',
          bank_account: entry.bank_account || '',
          kra_pin: entry.kra_pin || ''
        };
      });
      
      setSupplierIntakeRecords(intakeRecords);
    } catch (err: any) {
      console.error('Error fetching intake records:', err);
      setError(`Failed to load intake records: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, intake: false }));
    }
  };

  const fetchQualityChecks = async () => {
    try {
      setIsLoading(prev => ({ ...prev, quality: true }));
      const response = await fetch('/api/quality-control');
      if (!response.ok) throw new Error('Failed to fetch quality checks');
      const qualityChecksData = await response.json();
      
      const transformedChecks: QualityCheck[] = qualityChecksData.map((qc: any) => ({
        id: qc.id,
        weight_entry_id: qc.weight_entry_id,
        pallet_id: qc.pallet_id || `WE-${qc.weight_entry_id}`,
        supplier_name: qc.supplier_name || 'Unknown Supplier',
        overall_status: qc.overall_status,
        processed_at: qc.processed_at || new Date().toISOString(),
        fuerte_class1: qc.fuerte_class1 || 0,
        fuerte_class2: qc.fuerte_class2 || 0,
        fuerte_overall: qc.fuerte_overall || 0,
        hass_class1: qc.hass_class1 || 0,
        hass_class2: qc.hass_class2 || 0,
        hass_overall: qc.hass_overall || 0,
        rejected_weight: qc.rejected_weight || 0
      }));
      
      setQualityChecks(transformedChecks);
    } catch (err: any) {
      console.error('Error fetching quality checks:', err);
      setError(`Failed to load quality checks: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, quality: false }));
    }
  };

  const fetchCountingRecords = async () => {
    try {
      setIsLoading(prev => ({ ...prev, counting: true }));
      const response = await fetch('/api/counting?action=history');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const processedRecords = (result.data || []).map((record: any) => {
            let counting_data = record.counting_data;
            if (typeof counting_data === 'string') {
              try {
                counting_data = JSON.parse(counting_data);
              } catch (e) {
                console.error('Error parsing counting_data:', e);
                counting_data = {};
              }
            }
            
            let totals = record.totals;
            if (typeof totals === 'string') {
              try {
                totals = JSON.parse(totals);
              } catch (e) {
                console.error('Error parsing totals:', e);
                totals = {};
              }
            }
            
            return {
              ...record,
              counting_data,
              totals,
              bank_name: record.bank_name || '',
              bank_account: record.bank_account || '',
              kra_pin: record.kra_pin || '',
              rejected_weight: record.rejected_weight || 0
            };
          });
          
          // Fetch rejects to get accurate rejected weights
          const rejections = await fetchRejects();
          
          // Merge rejection data into counting records
          const recordsWithRejects = processedRecords.map(record => {
            const rejection = rejections.find(reject => 
              reject.weight_entry_id === record.id || 
              reject.pallet_id === record.pallet_id ||
              reject.supplier_id === record.supplier_id
            );
            
            if (rejection && (!record.rejected_weight || record.rejected_weight === 0)) {
              return {
                ...record,
                rejected_weight: rejection.total_rejected_weight || 0,
                rejection_reason: rejection.reason,
                rejection_notes: rejection.notes
              };
            }
            return record;
          });
          
          setCountingRecords(recordsWithRejects);
          
          // Calculate statistics from records with updated rejection data
          const calculatedStats = calculateStatsFromRecords(recordsWithRejects, rejections);
          setStats(calculatedStats);
          
          // Calculate size statistics
          calculateSizeStatistics(recordsWithRejects);
          
          return recordsWithRejects;
        }
      }
      return [];
    } catch (err: any) {
      console.error('Error fetching counting records:', err);
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, counting: false }));
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(prev => ({ ...prev, stats: true }));
      const response = await fetch('/api/counting?action=stats');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(prev => ({
            ...prev,
            ...result.data
          }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const calculateSizeStatistics = useCallback((records: CountingRecord[]) => {
    console.log('📊 Calculating size statistics from', records.length, 'records');
    
    const newStats = {
      fuerte: {
        '4kg': {
          variety: 'fuerte' as const,
          boxType: '4kg' as const,
          size12_class1: 0,
          size12_class2: 0,
          size14_class1: 0,
          size14_class2: 0,
          size16_class1: 0,
          size16_class2: 0,
          size18_class1: 0,
          size18_class2: 0,
          size20_class1: 0,
          size20_class2: 0,
          size22_class1: 0,
          size22_class2: 0,
          size24_class1: 0,
          size24_class2: 0,
          size26_class1: 0,
          size26_class2: 0,
        },
        '10kg': {
          variety: 'fuerte' as const,
          boxType: '10kg' as const,
          size12_class1: 0,
          size12_class2: 0,
          size14_class1: 0,
          size14_class2: 0,
          size16_class1: 0,
          size16_class2: 0,
          size18_class1: 0,
          size18_class2: 0,
          size20_class1: 0,
          size20_class2: 0,
          size22_class1: 0,
          size22_class2: 0,
          size24_class1: 0,
          size24_class2: 0,
          size26_class1: 0,
          size26_class2: 0,
          size28_class1: 0,
          size28_class2: 0,
          size30_class1: 0,
          size30_class2: 0,
          size32_class1: 0,
          size32_class2: 0,
        }
      },
      hass: {
        '4kg': {
          variety: 'hass' as const,
          boxType: '4kg' as const,
          size12_class1: 0,
          size12_class2: 0,
          size14_class1: 0,
          size14_class2: 0,
          size16_class1: 0,
          size16_class2: 0,
          size18_class1: 0,
          size18_class2: 0,
          size20_class1: 0,
          size20_class2: 0,
          size22_class1: 0,
          size22_class2: 0,
          size24_class1: 0,
          size24_class2: 0,
          size26_class1: 0,
          size26_class2: 0,
        },
        '10kg': {
          variety: 'hass' as const,
          boxType: '10kg' as const,
          size12_class1: 0,
          size12_class2: 0,
          size14_class1: 0,
          size14_class2: 0,
          size16_class1: 0,
          size16_class2: 0,
          size18_class1: 0,
          size18_class2: 0,
          size20_class1: 0,
          size20_class2: 0,
          size22_class1: 0,
          size22_class2: 0,
          size24_class1: 0,
          size24_class2: 0,
          size26_class1: 0,
          size26_class2: 0,
          size28_class1: 0,
          size28_class2: 0,
          size30_class1: 0,
          size30_class2: 0,
          size32_class1: 0,
          size32_class2: 0,
        }
      }
    };

    // FIXED: Better extraction of size data
    records.forEach(record => {
      const countingData = record.counting_data || {};
      const totals = record.totals || {};
      
      // Helper to safely get a value from counting_data or fallback to totals
      const getValue = (key: string): number => {
        // First try counting_data
        let value = countingData[key];
        if (value !== undefined && value !== null && value !== '') {
          const num = Number(value);
          if (!isNaN(num)) return num;
        }
        
        // Fallback to check if it's a totals key
        if (key.includes('_class') && key.includes('_size')) {
          // Extract size from key like "fuerte_4kg_class1_size12"
          const parts = key.split('_');
          if (parts.length >= 5) {
            const variety = parts[0];
            const boxType = parts[1];
            const classType = parts[2];
            const size = parts[4];
            
            // Try to find in totals structure
            const totalsKey = `${variety}_${boxType}_${classType}_size${size}`;
            const totalsValue = totals[totalsKey];
            if (totalsValue !== undefined) {
              const num = Number(totalsValue);
              if (!isNaN(num)) return num;
            }
          }
        }
        
        return 0;
      };

      // Debug: Log sample data
      if (records.indexOf(record) === 0) {
        console.log('Sample counting_data keys:', Object.keys(countingData).filter(k => k.includes('size')));
        console.log('Sample totals keys:', Object.keys(totals).filter(k => k.includes('size')));
      }

      // Fuerte 4kg sizes
      for (const size of ['12', '14', '16', '18', '20', '22', '24', '26']) {
        const class1Key = `fuerte_4kg_class1_size${size}`;
        const class2Key = `fuerte_4kg_class2_size${size}`;
        
        const class1 = getValue(class1Key);
        const class2 = getValue(class2Key);
        
        const class1Field = `size${size}_class1` as keyof VarietySizeStats;
        const class2Field = `size${size}_class2` as keyof VarietySizeStats;
        
        (newStats.fuerte['4kg'][class1Field] as number) += class1;
        (newStats.fuerte['4kg'][class2Field] as number) += class2;
      }

      // Fuerte 10kg sizes
      for (const size of ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32']) {
        const class1Key = `fuerte_10kg_class1_size${size}`;
        const class2Key = `fuerte_10kg_class2_size${size}`;
        
        const class1 = getValue(class1Key);
        const class2 = getValue(class2Key);
        
        const class1Field = `size${size}_class1` as keyof VarietySizeStats;
        const class2Field = `size${size}_class2` as keyof VarietySizeStats;
        
        (newStats.fuerte['10kg'][class1Field] as number) += class1;
        (newStats.fuerte['10kg'][class2Field] as number) += class2;
      }

      // Hass 4kg sizes
      for (const size of ['12', '14', '16', '18', '20', '22', '24', '26']) {
        const class1Key = `hass_4kg_class1_size${size}`;
        const class2Key = `hass_4kg_class2_size${size}`;
        
        const class1 = getValue(class1Key);
        const class2 = getValue(class2Key);
        
        const class1Field = `size${size}_class1` as keyof VarietySizeStats;
        const class2Field = `size${size}_class2` as keyof VarietySizeStats;
        
        (newStats.hass['4kg'][class1Field] as number) += class1;
        (newStats.hass['4kg'][class2Field] as number) += class2;
      }

      // Hass 10kg sizes
      for (const size of ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32']) {
        const class1Key = `hass_10kg_class1_size${size}`;
        const class2Key = `hass_10kg_class2_size${size}`;
        
        const class1 = getValue(class1Key);
        const class2 = getValue(class2Key);
        
        const class1Field = `size${size}_class1` as keyof VarietySizeStats;
        const class2Field = `size${size}_class2` as keyof VarietySizeStats;
        
        (newStats.hass['10kg'][class1Field] as number) += class1;
        (newStats.hass['10kg'][class2Field] as number) += class2;
      }
    });

    // Log the calculated statistics
    console.log('Calculated size statistics:', {
      fuerte_4kg_total: Object.values(newStats.fuerte['4kg']).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0),
      fuerte_10kg_total: Object.values(newStats.fuerte['10kg']).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0),
      hass_4kg_total: Object.values(newStats.hass['4kg']).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0),
      hass_10kg_total: Object.values(newStats.hass['10kg']).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0),
    });

    setSizeStatistics(newStats);
    return newStats;
  }, []);

  const fetchSizeStatistics = async () => {
    try {
      setIsLoading(prev => ({ ...prev, stats: true }));
      const response = await fetch('/api/counting?action=size-stats');
      if (response.ok) {
        const result = await response.json();
        console.log('API Size Statistics Result:', result);
        if (result.success && result.data) {
          // Ensure we have proper data structure
          if (result.data.fuerte && result.data.hass) {
            setSizeStatistics(result.data);
          } else {
            // If data structure is different, try to parse it
            console.log('Data structure mismatch, calculating from records');
            await fetchCountingRecords();
          }
        } else {
          // Fallback to calculating from local records
          calculateSizeStatistics(countingRecords);
        }
      } else {
        // Fallback to calculating from local records
        calculateSizeStatistics(countingRecords);
      }
      return sizeStatistics;
    } catch (err: any) {
      console.error('Error fetching size statistics:', err);
      // Fallback to calculating from local records
      calculateSizeStatistics(countingRecords);
      return sizeStatistics;
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchSupplierDetails = async (supplierId: string) => {
    try {
      setIsLoading(prev => ({ ...prev, supplierDetails: true }));
      const response = await fetch(`/api/counting?action=supplier-details&supplierId=${supplierId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedSupplierDetails(result.data);
          return result.data;
        }
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching supplier details:', err);
      return null;
    } finally {
      setIsLoading(prev => ({ ...prev, supplierDetails: false }));
    }
  };

  const fetchAllData = async () => {
    setError(null);
    await Promise.all([
      fetchIntakeRecords(),
      fetchQualityChecks(),
      fetchCountingRecords(),
      fetchSizeStatistics(),
      fetchRejects()
    ]);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleIntakeExpansion = (supplierName: string) => {
    const newExpanded = new Set(expandedIntake);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedIntake(newExpanded);
  };

  const toggleQualityExpansion = (supplierName: string) => {
    const newExpanded = new Set(expandedQuality);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedQuality(newExpanded);
  };

  const toggleHistoryExpansion = async (recordId: string) => {
    const newExpanded = new Set(expandedHistory);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
      
      const record = countingRecords.find(r => r.id === recordId);
      if (record?.supplier_id) {
        await fetchSupplierDetails(record.supplier_id);
      }
    }
    setExpandedHistory(newExpanded);
  };

  const acceptedSuppliers = supplierIntakeRecords.filter(intake => {
    const qc = qualityChecks.find(q => q.weight_entry_id === intake.id);
    const inCounting = countingRecords.some(record => record.supplier_id === intake.id);
    
    return qc && 
           qc.overall_status === 'approved' && 
           !inCounting;
  });

  const handleSelectSupplier = async (supplier: SupplierIntakeRecord, qc: QualityCheck | null) => {
    setSelectedSupplier(supplier);
    setSelectedQC(qc);
    
    const details = await fetchSupplierDetails(supplier.id);
    
    setCountingForm(prev => ({
      ...prev,
      supplier_id: supplier.id,
      supplier_name: supplier.supplier_name,
      region: supplier.region,
      fruits: safeArray(supplier.fruit_varieties).map(fv => ({
        name: fv.name,
        weight: fv.weight
      })),
      supplier_phone: supplier.supplier_phone || details?.payment_details?.phone_number || '',
      bank_name: supplier.bank_name || details?.payment_details?.bank_name || '',
      bank_account: supplier.bank_account || details?.payment_details?.bank_account || '',
      kra_pin: supplier.kra_pin || details?.payment_details?.kra_pin || ''
    }));
    
    if (expandedQuality.has(supplier.supplier_name)) {
      const newExpanded = new Set(expandedQuality);
      newExpanded.delete(supplier.supplier_name);
      setExpandedQuality(newExpanded);
    }
    
    setActiveTab('counting');
    
    toast({
      title: "Supplier Selected",
      description: `${supplier.supplier_name} loaded for counting`,
    });
  };

  // NEW: Function to load counting record for editing
  const handleEditCountingRecord = async (record: CountingRecord) => {
    try {
      // Find the original supplier intake record
      const supplierIntake = supplierIntakeRecords.find(r => r.id === record.supplier_id);
      
      if (!supplierIntake) {
        toast({
          title: "Cannot Edit",
          description: "Original supplier intake record not found",
          variant: "destructive",
        });
        return;
      }
      
      // Find quality check
      const qc = qualityChecks.find(q => q.weight_entry_id === record.supplier_id);
      
      // Set as editing mode
      setIsEditingMode(true);
      setEditingRecord(record);
      
      // Prepare the counting form with existing data
      const countingData = record.counting_data || {};
      
      const editForm: CountingFormData = {
        supplier_id: record.supplier_id,
        supplier_name: record.supplier_name,
        supplier_phone: record.supplier_phone || supplierIntake.supplier_phone || '',
        region: record.region,
        fruits: safeArray(supplierIntake.fruit_varieties).map(fv => ({
          name: fv.name,
          weight: fv.weight
        })),
        
        // Fuerte 4kg Class 1
        fuerte_4kg_class1_size12: countingData.fuerte_4kg_class1_size12 || 0,
        fuerte_4kg_class1_size14: countingData.fuerte_4kg_class1_size14 || 0,
        fuerte_4kg_class1_size16: countingData.fuerte_4kg_class1_size16 || 0,
        fuerte_4kg_class1_size18: countingData.fuerte_4kg_class1_size18 || 0,
        fuerte_4kg_class1_size20: countingData.fuerte_4kg_class1_size20 || 0,
        fuerte_4kg_class1_size22: countingData.fuerte_4kg_class1_size22 || 0,
        fuerte_4kg_class1_size24: countingData.fuerte_4kg_class1_size24 || 0,
        fuerte_4kg_class1_size26: countingData.fuerte_4kg_class1_size26 || 0,
        
        // Fuerte 4kg Class 2
        fuerte_4kg_class2_size12: countingData.fuerte_4kg_class2_size12 || 0,
        fuerte_4kg_class2_size14: countingData.fuerte_4kg_class2_size14 || 0,
        fuerte_4kg_class2_size16: countingData.fuerte_4kg_class2_size16 || 0,
        fuerte_4kg_class2_size18: countingData.fuerte_4kg_class2_size18 || 0,
        fuerte_4kg_class2_size20: countingData.fuerte_4kg_class2_size20 || 0,
        fuerte_4kg_class2_size22: countingData.fuerte_4kg_class2_size22 || 0,
        fuerte_4kg_class2_size24: countingData.fuerte_4kg_class2_size24 || 0,
        fuerte_4kg_class2_size26: countingData.fuerte_4kg_class2_size26 || 0,
        
        // Fuerte 10kg Class 1
        fuerte_10kg_class1_size12: countingData.fuerte_10kg_class1_size12 || 0,
        fuerte_10kg_class1_size14: countingData.fuerte_10kg_class1_size14 || 0,
        fuerte_10kg_class1_size16: countingData.fuerte_10kg_class1_size16 || 0,
        fuerte_10kg_class1_size18: countingData.fuerte_10kg_class1_size18 || 0,
        fuerte_10kg_class1_size20: countingData.fuerte_10kg_class1_size20 || 0,
        fuerte_10kg_class1_size22: countingData.fuerte_10kg_class1_size22 || 0,
        fuerte_10kg_class1_size24: countingData.fuerte_10kg_class1_size24 || 0,
        fuerte_10kg_class1_size26: countingData.fuerte_10kg_class1_size26 || 0,
        fuerte_10kg_class1_size28: countingData.fuerte_10kg_class1_size28 || 0,
        fuerte_10kg_class1_size30: countingData.fuerte_10kg_class1_size30 || 0,
        fuerte_10kg_class1_size32: countingData.fuerte_10kg_class1_size32 || 0,
        
        // Fuerte 10kg Class 2
        fuerte_10kg_class2_size12: countingData.fuerte_10kg_class2_size12 || 0,
        fuerte_10kg_class2_size14: countingData.fuerte_10kg_class2_size14 || 0,
        fuerte_10kg_class2_size16: countingData.fuerte_10kg_class2_size16 || 0,
        fuerte_10kg_class2_size18: countingData.fuerte_10kg_class2_size18 || 0,
        fuerte_10kg_class2_size20: countingData.fuerte_10kg_class2_size20 || 0,
        fuerte_10kg_class2_size22: countingData.fuerte_10kg_class2_size22 || 0,
        fuerte_10kg_class2_size24: countingData.fuerte_10kg_class2_size24 || 0,
        fuerte_10kg_class2_size26: countingData.fuerte_10kg_class2_size26 || 0,
        fuerte_10kg_class2_size28: countingData.fuerte_10kg_class2_size28 || 0,
        fuerte_10kg_class2_size30: countingData.fuerte_10kg_class2_size30 || 0,
        fuerte_10kg_class2_size32: countingData.fuerte_10kg_class2_size32 || 0,
        
        // Hass 4kg Class 1
        hass_4kg_class1_size12: countingData.hass_4kg_class1_size12 || 0,
        hass_4kg_class1_size14: countingData.hass_4kg_class1_size14 || 0,
        hass_4kg_class1_size16: countingData.hass_4kg_class1_size16 || 0,
        hass_4kg_class1_size18: countingData.hass_4kg_class1_size18 || 0,
        hass_4kg_class1_size20: countingData.hass_4kg_class1_size20 || 0,
        hass_4kg_class1_size22: countingData.hass_4kg_class1_size22 || 0,
        hass_4kg_class1_size24: countingData.hass_4kg_class1_size24 || 0,
        hass_4kg_class1_size26: countingData.hass_4kg_class1_size26 || 0,
        
        // Hass 4kg Class 2
        hass_4kg_class2_size12: countingData.hass_4kg_class2_size12 || 0,
        hass_4kg_class2_size14: countingData.hass_4kg_class2_size14 || 0,
        hass_4kg_class2_size16: countingData.hass_4kg_class2_size16 || 0,
        hass_4kg_class2_size18: countingData.hass_4kg_class2_size18 || 0,
        hass_4kg_class2_size20: countingData.hass_4kg_class2_size20 || 0,
        hass_4kg_class2_size22: countingData.hass_4kg_class2_size22 || 0,
        hass_4kg_class2_size24: countingData.hass_4kg_class2_size24 || 0,
        hass_4kg_class2_size26: countingData.hass_4kg_class2_size26 || 0,
        
        // Hass 10kg Class 1
        hass_10kg_class1_size12: countingData.hass_10kg_class1_size12 || 0,
        hass_10kg_class1_size14: countingData.hass_10kg_class1_size14 || 0,
        hass_10kg_class1_size16: countingData.hass_10kg_class1_size16 || 0,
        hass_10kg_class1_size18: countingData.hass_10kg_class1_size18 || 0,
        hass_10kg_class1_size20: countingData.hass_10kg_class1_size20 || 0,
        hass_10kg_class1_size22: countingData.hass_10kg_class1_size22 || 0,
        hass_10kg_class1_size24: countingData.hass_10kg_class1_size24 || 0,
        hass_10kg_class1_size26: countingData.hass_10kg_class1_size26 || 0,
        hass_10kg_class1_size28: countingData.hass_10kg_class1_size28 || 0,
        hass_10kg_class1_size30: countingData.hass_10kg_class1_size30 || 0,
        hass_10kg_class1_size32: countingData.hass_10kg_class1_size32 || 0,
        
        // Hass 10kg Class 2
        hass_10kg_class2_size12: countingData.hass_10kg_class2_size12 || 0,
        hass_10kg_class2_size14: countingData.hass_10kg_class2_size14 || 0,
        hass_10kg_class2_size16: countingData.hass_10kg_class2_size16 || 0,
        hass_10kg_class2_size18: countingData.hass_10kg_class2_size18 || 0,
        hass_10kg_class2_size20: countingData.hass_10kg_class2_size20 || 0,
        hass_10kg_class2_size22: countingData.hass_10kg_class2_size22 || 0,
        hass_10kg_class2_size24: countingData.hass_10kg_class2_size24 || 0,
        hass_10kg_class2_size26: countingData.hass_10kg_class2_size26 || 0,
        hass_10kg_class2_size28: countingData.hass_10kg_class2_size28 || 0,
        hass_10kg_class2_size30: countingData.hass_10kg_class2_size30 || 0,
        hass_10kg_class2_size32: countingData.hass_10kg_class2_size32 || 0,
        
        notes: record.notes || '',
        bank_name: record.bank_name || supplierIntake.bank_name || '',
        bank_account: record.bank_account || supplierIntake.bank_account || '',
        kra_pin: record.kra_pin || supplierIntake.kra_pin || '',
      };
      
      setCountingForm(editForm);
      setSelectedSupplier(supplierIntake);
      setSelectedQC(qc);
      setSelectedSupplierDetails(null);
      
      // Set collapsible sections based on data
      setExpandedFuerteClass2(
        Object.keys(countingData).some(k => 
          k.startsWith('fuerte_4kg_class2_') && countingData[k] > 0
        )
      );
      setExpandedFuerte10kg(
        Object.keys(countingData).some(k => 
          k.startsWith('fuerte_10kg_') && countingData[k] > 0
        )
      );
      setExpandedHassClass2(
        Object.keys(countingData).some(k => 
          k.startsWith('hass_4kg_class2_') && countingData[k] > 0
        )
      );
      setExpandedHass10kg(
        Object.keys(countingData).some(k => 
          k.startsWith('hass_10kg_') && countingData[k] > 0
        )
      );
      
      // Switch to counting tab
      setActiveTab('counting');
      
      toast({
        title: "Editing Mode Activated",
        description: `${record.supplier_name} loaded for editing. Make your changes and click 'Update Counting Data' to save.`,
        duration: 8000,
      });
      
    } catch (error: any) {
      console.error('Error loading record for editing:', error);
      toast({
        title: "Error",
        description: "Failed to load record for editing: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof CountingFormData, value: string | number) => {
    setCountingForm(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const calculateSubtotal = (prefix: string, classType: 'class1' | 'class2', boxType: '4kg' | '10kg'): number => {
    const sizes = boxType === '4kg' 
      ? ['12', '14', '16', '18', '20', '22', '24', '26']
      : ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
    
    return sizes.reduce((total, size) => {
      const fieldName = `${prefix}_${boxType}_${classType}_size${size}` as keyof CountingFormData;
      return total + (Number(countingForm[fieldName]) || 0);
    }, 0);
  };

  const calculateTotalBoxes = (prefix: string, boxType: '4kg' | '10kg'): number => {
    const class1 = calculateSubtotal(prefix, 'class1', boxType);
    const class2 = calculateSubtotal(prefix, 'class2', boxType);
    return class1 + class2;
  };

  const handleSubmitCountingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplier) {
      toast({
        title: "No Supplier Selected",
        description: "Please select a supplier first",
        variant: "destructive",
      });
      return;
    }

    try {
      const totals = {
        fuerte_4kg_class1: calculateSubtotal('fuerte', 'class1', '4kg'),
        fuerte_4kg_class2: calculateSubtotal('fuerte', 'class2', '4kg'),
        fuerte_4kg_total: calculateTotalBoxes('fuerte', '4kg'),
        
        fuerte_10kg_class1: calculateSubtotal('fuerte', 'class1', '10kg'),
        fuerte_10kg_class2: calculateSubtotal('fuerte', 'class2', '10kg'),
        fuerte_10kg_total: calculateTotalBoxes('fuerte', '10kg'),
        
        hass_4kg_class1: calculateSubtotal('hass', 'class1', '4kg'),
        hass_4kg_class2: calculateSubtotal('hass', 'class2', '4kg'),
        hass_4kg_total: calculateTotalBoxes('hass', '4kg'),
        
        hass_10kg_class1: calculateSubtotal('hass', 'class1', '10kg'),
        hass_10kg_class2: calculateSubtotal('hass', 'class2', '10kg'),
        hass_10kg_total: calculateTotalBoxes('hass', '10kg'),
      };

      const calculateTotalWeight = () => {
        const fuerte4kgWeight = totals.fuerte_4kg_total * 4;
        const fuerte10kgWeight = totals.fuerte_10kg_total * 10;
        const hass4kgWeight = totals.hass_4kg_total * 4;
        const hass10kgWeight = totals.hass_10kg_total * 10;
        return fuerte4kgWeight + fuerte10kgWeight + hass4kgWeight + hass10kgWeight;
      };

      const totalCountedWeight = calculateTotalWeight();
      const intakeWeight = selectedSupplier.total_weight;
      const rejectedWeight = intakeWeight - totalCountedWeight;

      const countingData = {
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.supplier_name,
        supplier_phone: countingForm.supplier_phone,
        region: selectedSupplier.region,
        pallet_id: selectedSupplier.pallet_id,
        total_weight: intakeWeight,
        counting_data: { ...countingForm },
        submitted_at: new Date().toISOString(),
        processed_by: "Warehouse Staff",
        totals,
        total_counted_weight: totalCountedWeight,
        // Add rejected weight
        rejected_weight: rejectedWeight > 0 ? rejectedWeight : 0,
        status: 'pending_coldroom',
        for_coldroom: true,
        bank_name: countingForm.bank_name,
        bank_account: countingForm.bank_account,
        kra_pin: countingForm.kra_pin,
        driver_name: selectedSupplier.driver_name,
        vehicle_plate: selectedSupplier.vehicle_plate
      };

      console.log('📦 Saving counting data directly to history:', countingData);

      const response = await fetch('/api/counting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(countingData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save counting data');
      }

      const countingRecordId = result.data.id;
      
      localStorage.setItem('recentCountingData', JSON.stringify({
        id: countingRecordId,
        supplier_name: selectedSupplier.supplier_name,
        totals,
        counting_data: countingForm,
        timestamp: new Date().toISOString()
      }));
      
      localStorage.setItem('refreshColdRoom', 'true');
      console.log('✅ Set refreshColdRoom flag for cold room');

      setCountingRecords(prev => [result.data, ...prev]);
      
      setSelectedSupplier(null);
      setSelectedQC(null);
      setSelectedSupplierDetails(null);
      
      const resetForm: CountingFormData = {
        supplier_id: '',
        supplier_name: '',
        supplier_phone: '',
        region: '',
        fruits: [],
        fuerte_4kg_class1_size12: 0,
        fuerte_4kg_class1_size14: 0,
        fuerte_4kg_class1_size16: 0,
        fuerte_4kg_class1_size18: 0,
        fuerte_4kg_class1_size20: 0,
        fuerte_4kg_class1_size22: 0,
        fuerte_4kg_class1_size24: 0,
        fuerte_4kg_class1_size26: 0,
        fuerte_4kg_class2_size12: 0,
        fuerte_4kg_class2_size14: 0,
        fuerte_4kg_class2_size16: 0,
        fuerte_4kg_class2_size18: 0,
        fuerte_4kg_class2_size20: 0,
        fuerte_4kg_class2_size22: 0,
        fuerte_4kg_class2_size24: 0,
        fuerte_4kg_class2_size26: 0,
        fuerte_10kg_class1_size12: 0,
        fuerte_10kg_class1_size14: 0,
        fuerte_10kg_class1_size16: 0,
        fuerte_10kg_class1_size18: 0,
        fuerte_10kg_class1_size20: 0,
        fuerte_10kg_class1_size22: 0,
        fuerte_10kg_class1_size24: 0,
        fuerte_10kg_class1_size26: 0,
        fuerte_10kg_class1_size28: 0,
        fuerte_10kg_class1_size30: 0,
        fuerte_10kg_class1_size32: 0,
        fuerte_10kg_class2_size12: 0,
        fuerte_10kg_class2_size14: 0,
        fuerte_10kg_class2_size16: 0,
        fuerte_10kg_class2_size18: 0,
        fuerte_10kg_class2_size20: 0,
        fuerte_10kg_class2_size22: 0,
        fuerte_10kg_class2_size24: 0,
        fuerte_10kg_class2_size26: 0,
        fuerte_10kg_class2_size28: 0,
        fuerte_10kg_class2_size30: 0,
        fuerte_10kg_class2_size32: 0,
        hass_4kg_class1_size12: 0,
        hass_4kg_class1_size14: 0,
        hass_4kg_class1_size16: 0,
        hass_4kg_class1_size18: 0,
        hass_4kg_class1_size20: 0,
        hass_4kg_class1_size22: 0,
        hass_4kg_class1_size24: 0,
        hass_4kg_class1_size26: 0,
        hass_4kg_class2_size12: 0,
        hass_4kg_class2_size14: 0,
        hass_4kg_class2_size16: 0,
        hass_4kg_class2_size18: 0,
        hass_4kg_class2_size20: 0,
        hass_4kg_class2_size22: 0,
        hass_4kg_class2_size24: 0,
        hass_4kg_class2_size26: 0,
        hass_10kg_class1_size12: 0,
        hass_10kg_class1_size14: 0,
        hass_10kg_class1_size16: 0,
        hass_10kg_class1_size18: 0,
        hass_10kg_class1_size20: 0,
        hass_10kg_class1_size22: 0,
        hass_10kg_class1_size24: 0,
        hass_10kg_class1_size26: 0,
        hass_10kg_class1_size28: 0,
        hass_10kg_class1_size30: 0,
        hass_10kg_class1_size32: 0,
        hass_10kg_class2_size12: 0,
        hass_10kg_class2_size14: 0,
        hass_10kg_class2_size16: 0,
        hass_10kg_class2_size18: 0,
        hass_10kg_class2_size20: 0,
        hass_10kg_class2_size22: 0,
        hass_10kg_class2_size24: 0,
        hass_10kg_class2_size26: 0,
        hass_10kg_class2_size28: 0,
        hass_10kg_class2_size30: 0,
        hass_10kg_class2_size32: 0,
        notes: '',
        bank_name: '',
        bank_account: '',
        kra_pin: '',
      };
      
      setExpandedFuerteClass2(false);
      setExpandedFuerte10kg(false);
      setExpandedHassClass2(false);
      setExpandedHass10kg(false);
      
      setCountingForm(resetForm);
      
      fetchAllData();
      setActiveTab('history');
      
      toast({
        title: "✅ Counting Data Saved Successfully!",
        description: (
          <div className="space-y-3">
            <p>{selectedSupplier.supplier_name} has been counted and is ready for cold room.</p>
            <div className="text-sm text-gray-500">
              Supplier has been removed from Quality Control tab
            </div>
            {rejectedWeight > 0 && (
              <div className="text-sm text-orange-600">
                Note: {rejectedWeight.toFixed(2)} kg marked as rejected weight
              </div>
            )}
          </div>
        ),
        duration: 10000,
      });
      
    } catch (err: any) {
      console.error('Error saving counting data:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to save counting data",
        variant: "destructive",
      });
    }
  };

  // NEW: Function to handle updating existing counting record
  const handleUpdateCountingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplier || !editingRecord) {
      toast({
        title: "Cannot Update",
        description: "No record selected for editing",
        variant: "destructive",
      });
      return;
    }

    try {
      const totals = {
        fuerte_4kg_class1: calculateSubtotal('fuerte', 'class1', '4kg'),
        fuerte_4kg_class2: calculateSubtotal('fuerte', 'class2', '4kg'),
        fuerte_4kg_total: calculateTotalBoxes('fuerte', '4kg'),
        
        fuerte_10kg_class1: calculateSubtotal('fuerte', 'class1', '10kg'),
        fuerte_10kg_class2: calculateSubtotal('fuerte', 'class2', '10kg'),
        fuerte_10kg_total: calculateTotalBoxes('fuerte', '10kg'),
        
        hass_4kg_class1: calculateSubtotal('hass', 'class1', '4kg'),
        hass_4kg_class2: calculateSubtotal('hass', 'class2', '4kg'),
        hass_4kg_total: calculateTotalBoxes('hass', '4kg'),
        
        hass_10kg_class1: calculateSubtotal('hass', 'class1', '10kg'),
        hass_10kg_class2: calculateSubtotal('hass', 'class2', '10kg'),
        hass_10kg_total: calculateTotalBoxes('hass', '10kg'),
      };

      const calculateTotalWeight = () => {
        const fuerte4kgWeight = totals.fuerte_4kg_total * 4;
        const fuerte10kgWeight = totals.fuerte_10kg_total * 10;
        const hass4kgWeight = totals.hass_4kg_total * 4;
        const hass10kgWeight = totals.hass_10kg_total * 10;
        return fuerte4kgWeight + fuerte10kgWeight + hass4kgWeight + hass10kgWeight;
      };

      const totalCountedWeight = calculateTotalWeight();
      const intakeWeight = selectedSupplier.total_weight;
      const rejectedWeight = intakeWeight - totalCountedWeight;

      const updatedData = {
        id: editingRecord.id,
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.supplier_name,
        supplier_phone: countingForm.supplier_phone,
        region: selectedSupplier.region,
        pallet_id: selectedSupplier.pallet_id,
        total_weight: intakeWeight,
        counting_data: { ...countingForm },
        submitted_at: new Date().toISOString(),
        processed_by: "Warehouse Staff (Updated)",
        totals,
        total_counted_weight: totalCountedWeight,
        rejected_weight: rejectedWeight > 0 ? rejectedWeight : 0,
        status: 'pending_coldroom',
        for_coldroom: true,
        bank_name: countingForm.bank_name,
        bank_account: countingForm.bank_account,
        kra_pin: countingForm.kra_pin,
        driver_name: selectedSupplier.driver_name,
        vehicle_plate: selectedSupplier.vehicle_plate,
        notes: countingForm.notes
      };

      console.log('🔄 Updating counting record:', updatedData);

      // First delete the old record
      const deleteResponse = await fetch(`/api/counting?id=${editingRecord.id}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete old record');
      }

      // Then create new record with updated data
      const createResponse = await fetch('/api/counting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await createResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update counting data');
      }

      localStorage.setItem('refreshColdRoom', 'true');
      console.log('✅ Set refreshColdRoom flag for cold room');

      // Update local state
      setCountingRecords(prev => {
        const filtered = prev.filter(record => record.id !== editingRecord.id);
        return [result.data, ...filtered];
      });
      
      // Reset form and exit edit mode
      const resetForm: CountingFormData = {
        supplier_id: '',
        supplier_name: '',
        supplier_phone: '',
        region: '',
        fruits: [],
        fuerte_4kg_class1_size12: 0,
        fuerte_4kg_class1_size14: 0,
        fuerte_4kg_class1_size16: 0,
        fuerte_4kg_class1_size18: 0,
        fuerte_4kg_class1_size20: 0,
        fuerte_4kg_class1_size22: 0,
        fuerte_4kg_class1_size24: 0,
        fuerte_4kg_class1_size26: 0,
        fuerte_4kg_class2_size12: 0,
        fuerte_4kg_class2_size14: 0,
        fuerte_4kg_class2_size16: 0,
        fuerte_4kg_class2_size18: 0,
        fuerte_4kg_class2_size20: 0,
        fuerte_4kg_class2_size22: 0,
        fuerte_4kg_class2_size24: 0,
        fuerte_4kg_class2_size26: 0,
        fuerte_10kg_class1_size12: 0,
        fuerte_10kg_class1_size14: 0,
        fuerte_10kg_class1_size16: 0,
        fuerte_10kg_class1_size18: 0,
        fuerte_10kg_class1_size20: 0,
        fuerte_10kg_class1_size22: 0,
        fuerte_10kg_class1_size24: 0,
        fuerte_10kg_class1_size26: 0,
        fuerte_10kg_class1_size28: 0,
        fuerte_10kg_class1_size30: 0,
        fuerte_10kg_class1_size32: 0,
        fuerte_10kg_class2_size12: 0,
        fuerte_10kg_class2_size14: 0,
        fuerte_10kg_class2_size16: 0,
        fuerte_10kg_class2_size18: 0,
        fuerte_10kg_class2_size20: 0,
        fuerte_10kg_class2_size22: 0,
        fuerte_10kg_class2_size24: 0,
        fuerte_10kg_class2_size26: 0,
        fuerte_10kg_class2_size28: 0,
        fuerte_10kg_class2_size30: 0,
        fuerte_10kg_class2_size32: 0,
        hass_4kg_class1_size12: 0,
        hass_4kg_class1_size14: 0,
        hass_4kg_class1_size16: 0,
        hass_4kg_class1_size18: 0,
        hass_4kg_class1_size20: 0,
        hass_4kg_class1_size22: 0,
        hass_4kg_class1_size24: 0,
        hass_4kg_class1_size26: 0,
        hass_4kg_class2_size12: 0,
        hass_4kg_class2_size14: 0,
        hass_4kg_class2_size16: 0,
        hass_4kg_class2_size18: 0,
        hass_4kg_class2_size20: 0,
        hass_4kg_class2_size22: 0,
        hass_4kg_class2_size24: 0,
        hass_4kg_class2_size26: 0,
        hass_10kg_class1_size12: 0,
        hass_10kg_class1_size14: 0,
        hass_10kg_class1_size16: 0,
        hass_10kg_class1_size18: 0,
        hass_10kg_class1_size20: 0,
        hass_10kg_class1_size22: 0,
        hass_10kg_class1_size24: 0,
        hass_10kg_class1_size26: 0,
        hass_10kg_class1_size28: 0,
        hass_10kg_class1_size30: 0,
        hass_10kg_class1_size32: 0,
        hass_10kg_class2_size12: 0,
        hass_10kg_class2_size14: 0,
        hass_10kg_class2_size16: 0,
        hass_10kg_class2_size18: 0,
        hass_10kg_class2_size20: 0,
        hass_10kg_class2_size22: 0,
        hass_10kg_class2_size24: 0,
        hass_10kg_class2_size26: 0,
        hass_10kg_class2_size28: 0,
        hass_10kg_class2_size30: 0,
        hass_10kg_class2_size32: 0,
        notes: '',
        bank_name: '',
        bank_account: '',
        kra_pin: '',
      };
      
      setCountingForm(resetForm);
      setSelectedSupplier(null);
      setSelectedQC(null);
      setSelectedSupplierDetails(null);
      setEditingRecord(null);
      setIsEditingMode(false);
      
      setExpandedFuerteClass2(false);
      setExpandedFuerte10kg(false);
      setExpandedHassClass2(false);
      setExpandedHass10kg(false);
      
      fetchAllData();
      setActiveTab('history');
      
      toast({
        title: "✅ Counting Data Updated Successfully!",
        description: (
          <div className="space-y-3">
            <p>{selectedSupplier.supplier_name}'s counting data has been updated.</p>
            <div className="text-sm text-gray-500">
              Record has been updated in the history
            </div>
            {rejectedWeight > 0 && (
              <div className="text-sm text-orange-600">
                Note: {rejectedWeight.toFixed(2)} kg marked as rejected weight
              </div>
            )}
          </div>
        ),
        duration: 10000,
      });
      
    } catch (err: any) {
      console.error('Error updating counting data:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update counting data",
        variant: "destructive",
      });
    }
  };

  const filteredHistory = countingRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pallet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.submitted_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    let matchesDate = true;
    if (start) {
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && recordDate >= start;
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && recordDate <= end;
    }
    
    return matchesSearch && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const clearSearchFilter = () => {
    setSearchTerm('');
  };

const generateCSVData = (records: CountingRecord[]): CSVRow[] => {
  return records.map(record => {
    const boxesSummary = getBoxesSummary(record.totals);
    const supplierInfo = getSupplierInfoFromCountingData(record.counting_data);
    
    return {
      date: format(new Date(record.submitted_at), 'yyyy-MM-dd HH:mm:ss'),
      supplier_name: record.supplier_name,
      region: record.region,
      // REMOVED: pallet_id column
      driver_name: supplierInfo.driver_name,
      vehicle_plate: supplierInfo.vehicle_plate,
      intake_weight_kg: record.total_weight,
      counted_weight_kg: record.total_counted_weight || 0,
      rejected_weight_kg: record.rejected_weight || 0,
      weight_variance_kg: (record.total_weight - (record.total_counted_weight || 0) - (record.rejected_weight || 0)),
      fuerte_4kg_boxes: boxesSummary.fuerte_4kg,
      fuerte_10kg_crates: boxesSummary.fuerte_10kg,
      hass_4kg_boxes: boxesSummary.hass_4kg,
      hass_10kg_crates: boxesSummary.hass_10kg,
      total_boxes: boxesSummary.total,
      // CHANGED: processed_by to "Counting Clerk"
      processed_by: "Counting Clerk", // Changed from record.processed_by
      notes: record.notes || '',
      // REMOVED: rejection_reason column
    };
  });
};

const downloadCSV = (records: CountingRecord[]) => {
  if (records.length === 0) {
    toast({
      title: 'No Data',
      description: 'No records available to download',
      variant: 'destructive',
    });
    return;
  }
  
  const csvData = generateCSVData(records);
  
  // UPDATED: Removed 'Pallet ID' and 'Rejection Reason' columns
  const headers = [
    'Date',
    'Supplier Name',
    'Region',
    'Driver Name',
    'Vehicle Plate',
    'Intake Weight (kg)',
    'Counted Weight (kg)',
    'Rejected Weight (kg)',
    'Weight Variance (kg)',
    'Fuerte 4kg Boxes',
    'Fuerte 10kg Crates',
    'Hass 4kg Boxes',
    'Hass 10kg Crates',
    'Total Boxes',
    'Processed By',
    'Notes'
  ];
  
  // Convert data rows
  const rows = csvData.map(row => [
    row.date,
    `"${row.supplier_name}"`,
    `"${row.region}"`,
    `"${row.driver_name}"`,
    `"${row.vehicle_plate}"`,
    row.intake_weight_kg.toFixed(2),
    row.counted_weight_kg.toFixed(2),
    row.rejected_weight_kg.toFixed(2),
    row.weight_variance_kg.toFixed(2),
    row.fuerte_4kg_boxes,
    row.fuerte_10kg_crates,
    row.hass_4kg_boxes,
    row.hass_10kg_crates,
    row.total_boxes,
    `"${row.processed_by}"`, // Now always "Counting Clerk"
    `"${row.notes.replace(/"/g, '""')}"`
  ]);
  
  // Calculate totals
  const totals = {
    intake_weight: csvData.reduce((sum, row) => sum + row.intake_weight_kg, 0),
    counted_weight: csvData.reduce((sum, row) => sum + row.counted_weight_kg, 0),
    rejected_weight: csvData.reduce((sum, row) => sum + row.rejected_weight_kg, 0),
    weight_variance: csvData.reduce((sum, row) => sum + row.weight_variance_kg, 0),
    fuerte_4kg: csvData.reduce((sum, row) => sum + row.fuerte_4kg_boxes, 0),
    fuerte_10kg: csvData.reduce((sum, row) => sum + row.fuerte_10kg_crates, 0),
    hass_4kg: csvData.reduce((sum, row) => sum + row.hass_4kg_boxes, 0),
    hass_10kg: csvData.reduce((sum, row) => sum + row.hass_10kg_crates, 0),
    total_boxes: csvData.reduce((sum, row) => sum + row.total_boxes, 0),
  };
  
  // Add totals row
  const totalsRow = [
    'TOTALS',
    '', // Supplier Name
    '', // Region
    '', // Driver Name
    '', // Vehicle Plate
    totals.intake_weight.toFixed(2),
    totals.counted_weight.toFixed(2),
    totals.rejected_weight.toFixed(2),
    totals.weight_variance.toFixed(2),
    totals.fuerte_4kg,
    totals.fuerte_10kg,
    totals.hass_4kg,
    totals.hass_10kg,
    totals.total_boxes,
    '', // Processed By
    ''  // Notes
  ];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    totalsRow.join(',')
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `warehouse_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast({
    title: 'CSV Downloaded',
    description: `${records.length} records exported with totals row`,
  });
};

  const downloadAllHistory = () => {
    downloadCSV(countingRecords);
  };

  const downloadFilteredHistory = () => {
    downloadCSV(filteredHistory);
  };

  const downloadWarehouseGRN = async (record: CountingRecord) => {
    try {
      await generateWarehouseGRN(record);
      
      toast({
        title: '✅ Warehouse GRN Downloaded',
        description: `Goods Received Note has been downloaded for ${record.supplier_name}`,
      });
      
    } catch (error: any) {
      console.error('Error downloading warehouse GRN:', error);
      toast({
        title: 'Error Downloading GRN',
        description: error.message || 'Failed to generate GRN. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderSizeGrid = (prefix: string, boxType: '4kg' | '10kg', classType: 'class1' | 'class2') => {
    const sizes = boxType === '4kg' 
      ? ['12', '14', '16', '18', '20', '22', '24', '26']
      : ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
    
    return (
      <div className="grid grid-cols-8 gap-2 mb-4">
        {sizes.map(size => {
          const fieldName = `${prefix}_${boxType}_${classType}_size${size}` as keyof CountingFormData;
          return (
            <div key={size} className="space-y-1">
              <Label htmlFor={fieldName} className="text-xs text-center block">Size {size}</Label>
              <Input
                id={fieldName}
                type="number"
                min="0"
                value={countingForm[fieldName]}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                className="h-8 text-center"
                placeholder="0"
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderCollapsibleSection = (
    title: string,
    isExpanded: boolean,
    onToggle: () => void,
    children: React.ReactNode,
    subtitle?: string
  ) => (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggle}
      className="border rounded-lg overflow-hidden mb-4"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold">{title}</div>
              {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
            </div>
          </div>
          <Badge variant="outline" className="bg-black-100 text-gray-700">
            {isExpanded ? 'Hide' : 'Show'}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 bg-black border-t">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  const renderSizeBreakdown = (prefix: string, boxType: '4kg' | '10kg', classType: 'class1' | 'class2') => {
    const sizes = boxType === '4kg' 
      ? ['12', '14', '16', '18', '20', '22', '24', '26']
      : ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
    
    return (
      <div className="grid grid-cols-8 gap-2 mb-2">
        {sizes.map(size => {
          const fieldName = `${prefix}_${boxType}_${classType}_size${size}` as keyof CountingFormData;
          const value = countingForm[fieldName] || 0;
          if (value === 0) return null;
          
          return (
            <div key={size} className="text-center">
              <div className="text-xs text-gray-500">Size {size}</div>
              <div className="font-bold">{value}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBoxesBreakdown = (record: CountingRecord) => {
    const countingData = record.counting_data || {};
    
    const renderSizeTable = (variety: string, boxType: '4kg' | '10kg') => {
      const sizes = boxType === '4kg' 
        ? ['12', '14', '16', '18', '20', '22', '24', '26']
        : ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
      
      return (
        <div className="mb-4">
          <div className="font-semibold text-sm mb-2">{variety} {boxType} Boxes</div>
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="col-span-2 font-medium text-xs">Size</div>
            <div className="col-span-2 font-medium text-xs">Class 1</div>
            <div className="col-span-3 font-medium text-xs">Class 2</div>
          </div>
          {sizes.map(size => {
            const class1Key = `${variety.toLowerCase()}_${boxType}_class1_size${size}`;
            const class2Key = `${variety.toLowerCase()}_${boxType}_class2_size${size}`;
            const class1 = countingData[class1Key] || 0;
            const class2 = countingData[class2Key] || 0;
            
            if (class1 === 0 && class2 === 0) return null;
            
            return (
              <div key={size} className="grid grid-cols-8 gap-1 py-1 border-b">
                <div className="col-span-2 text-sm">Size {size}</div>
                <div className="col-span-1 text-center">{class1}</div>
                <div className="col-span-3 text-center">{class2}</div>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black-50 p-3 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3">Fuerte Avocado</h4>
            {renderSizeTable('fuerte', '4kg')}
            {renderSizeTable('fuerte', '10kg')}
          </div>
          <div className="bg-black-50 p-3 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3">Hass Avocado</h4>
            {renderSizeTable('hass', '4kg')}
            {renderSizeTable('hass', '10kg')}
          </div>
        </div>
      </div>
    );
  };

  const calculateTotalsFromSizeStats = () => {
    const totals = {
      fuerte: {
        '4kg': {
          class1: 0,
          class2: 0,
          total: 0
        },
        '10kg': {
          class1: 0,
          class2: 0,
          total: 0
        },
        overall: 0
      },
      hass: {
        '4kg': {
          class1: 0,
          class2: 0,
          total: 0
        },
        '10kg': {
          class1: 0,
          class2: 0,
          total: 0
        },
        overall: 0
      },
      grandTotal: 0
    };

    for (const size of ['12', '14', '16', '18', '20', '22', '24', '26']) {
      totals.fuerte['4kg'].class1 += sizeStatistics.fuerte['4kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
      totals.fuerte['4kg'].class2 += sizeStatistics.fuerte['4kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
    }
    totals.fuerte['4kg'].total = totals.fuerte['4kg'].class1 + totals.fuerte['4kg'].class2;

    for (const size of ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32']) {
      totals.fuerte['10kg'].class1 += sizeStatistics.fuerte['10kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
      totals.fuerte['10kg'].class2 += sizeStatistics.fuerte['10kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
    }
    totals.fuerte['10kg'].total = totals.fuerte['10kg'].class1 + totals.fuerte['10kg'].class2;
    totals.fuerte.overall = totals.fuerte['4kg'].total + totals.fuerte['10kg'].total;

    for (const size of ['12', '14', '16', '18', '20', '22', '24', '26']) {
      totals.hass['4kg'].class1 += sizeStatistics.hass['4kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
      totals.hass['4kg'].class2 += sizeStatistics.hass['4kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
    }
    totals.hass['4kg'].total = totals.hass['4kg'].class1 + totals.hass['4kg'].class2;

    for (const size of ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32']) {
      totals.hass['10kg'].class1 += sizeStatistics.hass['10kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
      totals.hass['10kg'].class2 += sizeStatistics.hass['10kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
    }
    totals.hass['10kg'].total = totals.hass['10kg'].class1 + totals.hass['10kg'].class2;
    totals.hass.overall = totals.hass['4kg'].total + totals.hass['10kg'].total;

    totals.grandTotal = totals.fuerte.overall + totals.hass.overall;

    return totals;
  };

  const sizeTotals = calculateTotalsFromSizeStats();

  const today = new Date();
  const todayIntakeRecords = supplierIntakeRecords.filter(record => {
    const recordDate = new Date(record.timestamp);
    return isSameDay(recordDate, today);
  });

  const todayFuerteWeight = todayIntakeRecords.reduce((sum, record) => sum + record.fuerte_weight, 0);
  const todayHassWeight = todayIntakeRecords.reduce((sum, record) => sum + record.hass_weight, 0);
  const todayFuerteCrates = todayIntakeRecords.reduce((sum, record) => sum + record.fuerte_crates, 0);
  const todayHassCrates = todayIntakeRecords.reduce((sum, record) => sum + record.hass_crates, 0);

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
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading data</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={fetchAllData}
                    className="text-sm underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-sm hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <HardHat />
                Warehouse Processing Dashboard
              </h2>
              <p className="text-muted-foreground">
                Supplier intake, quality control, and box counting
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <div className="text-sm text-muted-foreground">
                  Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <button
                onClick={fetchAllData}
                disabled={isLoading.intake || isLoading.quality || isLoading.counting}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading.intake || isLoading.quality || isLoading.counting ? 'animate-spin' : ''}`} />
                {isLoading.intake || isLoading.quality || isLoading.counting ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Statistics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Warehouse Statistics Summary
              </CardTitle>
              <CardDescription>
                Real-time statistics from counting history and today's activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Total Processed</div>
                    <History className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {stats.total_processed}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {stats.recent_activity.last_7_days} in last 7 days
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Pending Cold Room</div>
                    <Package className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {stats.pending_coldroom}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Ready for cold room loading
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Unique Suppliers</div>
                    <Users className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {stats.total_suppliers}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Processed suppliers
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Today's Intake</div>
                    <Truck className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {todayIntakeRecords.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {todayFuerteWeight + todayHassWeight} kg received
                  </div>
                </div>
              </div>

              {/* Box Totals */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800">Fuerte Avocado Boxes</h4>
                    <Apple className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">4kg Boxes</div>
                      <div className="text-2xl font-bold text-green-700">{stats.fuerte_4kg}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">10kg Crates</div>
                      <div className="text-2xl font-bold text-green-700">{stats.fuerte_10kg}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-900">Total Fuerte:</span>
                      <span className="font-bold text-lg text-green-900">
                        {stats.fuerte_4kg + stats.fuerte_10kg} boxes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800">Hass Avocado Boxes</h4>
                    <Apple className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">4kg Boxes</div>
                      <div className="text-2xl font-bold text-purple-700">{stats.hass_4kg}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">10kg Crates</div>
                      <div className="text-2xl font-bold text-purple-700">{stats.hass_10kg}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-900">Total Hass:</span>
                      <span className="font-bold text-lg text-purple-900">
                        {stats.hass_4kg + stats.hass_10kg} boxes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weight Summary */}
              {stats.weight_summary && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Weight Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Intake Weight</div>
                      <div className="text-xl font-bold text-blue-700">
                        {safeToFixed(stats.weight_summary.total_intake_weight, 1)} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Counted Weight</div>
                      <div className="text-xl font-bold text-blue-700">
                        {safeToFixed(stats.weight_summary.total_counted_weight, 1)} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Rejected Weight</div>
                      <div className="text-xl font-bold text-orange-700">
                        {safeToFixed(stats.weight_summary.total_rejected_weight, 1)} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Weight Variance</div>
                      <div className={`text-xl font-bold ${
                        (stats.weight_summary.total_intake_weight - stats.weight_summary.total_counted_weight - stats.weight_summary.total_rejected_weight) > 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {safeToFixed(stats.weight_summary.total_intake_weight - stats.weight_summary.total_counted_weight - stats.weight_summary.total_rejected_weight, 1)} kg
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Stages</CardTitle>
              <CardDescription>Supplier processing workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 text-center">
                {processingStages.map((stage, index) => (
                  <div key={stage.id} className="flex-1 flex flex-col items-center p-4">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <stage.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold">{stage.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded-md mt-2">{stage.tag}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="intake">Intake</TabsTrigger>
              <TabsTrigger value="quality">Quality Control</TabsTrigger>
              <TabsTrigger value="counting">Counting</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            {/* Intake Tab */}
            <TabsContent value="intake" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Completed Intake Records
                  </CardTitle>
                  <CardDescription>
                    {supplierIntakeRecords.length} supplier(s) with completed intake
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {isLoading.intake ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading intake records...</p>
                      </div>
                    ) : supplierIntakeRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No intake records found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Supplier intake records will appear here after weighing
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {supplierIntakeRecords.map((supplier) => {
                          const hasFuerte = supplier.fuerte_weight > 0;
                          const hasHass = supplier.hass_weight > 0;
                          
                          return (
                            <Collapsible
                              key={supplier.id}
                              open={expandedIntake.has(supplier.supplier_name)}
                              onOpenChange={() => toggleIntakeExpansion(supplier.supplier_name)}
                              className="border rounded-lg overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform ${expandedIntake.has(supplier.supplier_name) ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold">{supplier.supplier_name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>Pallet: {supplier.pallet_id}</span>
                                        <span>Weight: {supplier.total_weight} kg</span>
                                        <span>{formatDate(supplier.timestamp)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {hasFuerte && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <Apple className="w-3 h-3 mr-1" />
                                        Fuerte: {supplier.fuerte_weight}kg
                                      </Badge>
                                    )}
                                    {hasHass && (
                                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                        <Apple className="w-3 h-3 mr-1" />
                                        Hass: {supplier.hass_weight}kg
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      Intake Complete
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-black border-t">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-500">Driver</div>
                                    <div className="font-medium">{supplier.driver_name}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Vehicle Plate</div>
                                    <div className="font-medium">{supplier.vehicle_plate}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Region</div>
                                    <div className="font-medium">{supplier.region}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Phone</div>
                                    <div className="font-medium">{supplier.supplier_phone || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">KRA PIN</div>
                                    <div className="font-medium">{supplier.kra_pin || 'N/A'}</div>
                                  </div>
                                </div>
                                
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {hasFuerte && (
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="font-medium text-green-800 flex items-center gap-2">
                                        <Apple className="w-4 h-4" />
                                        Fuerte Avocado
                                      </div>
                                      <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div>
                                          <div className="text-xs text-gray-500">Weight</div>
                                          <div className="font-bold">{supplier.fuerte_weight} kg</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500">Crates</div>
                                          <div className="font-bold">{supplier.fuerte_crates}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {hasHass && (
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="font-medium text-purple-800 flex items-center gap-2">
                                        <Apple className="w-4 h-4" />
                                        Hass Avocado
                                      </div>
                                      <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div>
                                          <div className="text-xs text-gray-500">Weight</div>
                                          <div className="font-bold">{supplier.hass_weight} kg</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500">Crates</div>
                                          <div className="font-bold">{supplier.hass_crates}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quality Control Tab */}
            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Quality Control Results
                  </CardTitle>
                  <CardDescription>
                    {qualityChecks.filter(qc => {
                      const alreadyCounted = isSupplierCounted(qc.weight_entry_id, countingRecords);
                      return qc.overall_status === 'approved' && !alreadyCounted;
                    }).length} approved supplier(s) ready for counting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {isLoading.quality ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading quality checks...</p>
                      </div>
                    ) : qualityChecks.length === 0 ? (
                      <div className="text-center py-8">
                        <Scale className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No quality checks found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Quality control assessments will appear here after inspection
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {qualityChecks
                          .filter(qc => {
                            const alreadyCounted = isSupplierCounted(qc.weight_entry_id, countingRecords);
                            return qc.overall_status === 'approved' && !alreadyCounted;
                          })
                          .map((qc) => {
                            const supplierIntake = supplierIntakeRecords.find(r => r.id === qc.weight_entry_id);
                            const hasFuerteQC = qc.fuerte_overall > 0;
                            const hasHassQC = qc.hass_overall > 0;
                            const alreadyCounted = isSupplierCounted(qc.weight_entry_id, countingRecords);
                            
                            return (
                              <Collapsible
                                key={qc.id}
                                open={expandedQuality.has(qc.supplier_name)}
                                onOpenChange={() => toggleQualityExpansion(qc.supplier_name)}
                                className="border rounded-lg overflow-hidden"
                              >
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                      <div className={`transition-transform ${expandedQuality.has(qc.supplier_name) ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="font-semibold">{qc.supplier_name}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-4">
                                          <span>Pallet: {qc.pallet_id}</span>
                                          <span>Status: {qc.overall_status}</span>
                                          <span>{formatDate(qc.processed_at)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {hasFuerteQC && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          Fuerte: {qc.fuerte_overall}%
                                        </Badge>
                                      )}
                                      {hasHassQC && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                          Hass: {qc.hass_overall}%
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className={
                                        qc.overall_status === 'approved' 
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                                      }>
                                        {qc.overall_status === 'approved' ? 'Approved' : 'Rejected'}
                                      </Badge>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-4 bg-black border-t">
                                  <div className="space-y-4">
                                    {supplierIntake && (
                                      <div className="bg-black-50 p-3 rounded">
                                        <div className="font-medium text-gray-700 mb-2">Intake Details</div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                          <div>
                                            <div className="text-gray-500">Weight</div>
                                            <div className="font-medium">{supplierIntake.total_weight} kg</div>
                                          </div>
                                          {supplierIntake.fuerte_weight > 0 && (
                                            <div>
                                              <div className="text-gray-500">Fuerte Weight</div>
                                              <div className="font-medium text-green-700">{supplierIntake.fuerte_weight} kg</div>
                                            </div>
                                          )}
                                          {supplierIntake.hass_weight > 0 && (
                                            <div>
                                              <div className="text-gray-500">Hass Weight</div>
                                              <div className="font-medium text-purple-700">{supplierIntake.hass_weight} kg</div>
                                            </div>
                                          )}
                                          <div>
                                            <div className="text-gray-500">Region</div>
                                            <div className="font-medium">{supplierIntake.region}</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Driver</div>
                                            <div className="font-medium">{supplierIntake.driver_name}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {hasFuerteQC && (
                                        <div className="bg-green-50 p-4 rounded border border-green-200">
                                          <div className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                            <Apple className="w-4 h-4" />
                                            Fuerte Avocado Quality
                                          </div>
                                          <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">Class 1 (Premium):</span>
                                              <span className="font-bold text-green-700">{qc.fuerte_class1}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">Class 2 (Standard):</span>
                                              <span className="font-bold text-yellow-600">{qc.fuerte_class2}%</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-green-200">
                                              <span className="font-semibold">Overall Quality:</span>
                                              <span className={`font-bold text-lg ${
                                                qc.fuerte_overall >= 80 ? 'text-green-700' : 
                                                qc.fuerte_overall >= 60 ? 'text-yellow-600' : 'text-red-600'
                                              }`}>
                                                {qc.fuerte_overall}%
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {hasHassQC && (
                                        <div className="bg-purple-50 p-4 rounded border border-purple-200">
                                          <div className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                            <Apple className="w-4 h-4" />
                                            Hass Avocado Quality
                                          </div>
                                          <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">Class 1 (Premium):</span>
                                              <span className="font-bold text-purple-700">{qc.hass_class1}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">Class 2 (Standard):</span>
                                              <span className="font-bold text-yellow-600">{qc.hass_class2}%</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                                              <span className="font-semibold">Overall Quality:</span>
                                              <span className={`font-bold text-lg ${
                                                qc.hass_overall >= 80 ? 'text-green-700' : 
                                                qc.hass_overall >= 60 ? 'text-yellow-600' : 'text-red-600'
                                              }`}>
                                                {qc.hass_overall}%
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {qc.overall_status === 'approved' && supplierIntake && !alreadyCounted && (
                                      <div className="pt-4 border-t">
                                        <Button
                                          onClick={() => {
                                            const intakeRecord = supplierIntakeRecords.find(r => r.id === qc.weight_entry_id);
                                            if (intakeRecord) {
                                              handleSelectSupplier(intakeRecord, qc);
                                            }
                                          }}
                                          className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                          <Calculator className="w-4 h-4 mr-2" />
                                          Select for Counting
                                        </Button>
                                      </div>
                                    )}

                                    {alreadyCounted && (
                                      <div className="pt-4 border-t">
                                        <div className="text-center p-3 bg-black-50 rounded-lg">
                                          <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                                          <p className="text-sm font-medium text-blue-700">Already Counted</p>
                                          <p className="text-xs text-blue-600">
                                            This supplier has been processed and is in the History tab
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Counting Tab */}
            <TabsContent value="counting" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {isEditingMode ? 'Editing Supplier Information' : 'Selected Supplier Information'}
                    </CardTitle>
                    <CardDescription>
                      {selectedSupplier ? `${selectedSupplier.supplier_name} - ${isEditingMode ? 'Editing mode' : 'Ready for counting'}` : 'No supplier selected'}
                      {isEditingMode && editingRecord && (
                        <span className="ml-2 text-blue-600">
                          (Editing record from {formatDate(editingRecord.submitted_at)})
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSupplier ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Supplier Name</div>
                            <div className="font-semibold">{selectedSupplier.supplier_name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Region</div>
                            <div className="font-medium">{selectedSupplier.region}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Pallet ID</div>
                            <div className="font-mono">{selectedSupplier.pallet_id}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Total Weight</div>
                            <div className="font-bold">{selectedSupplier.total_weight} kg</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedSupplier.fuerte_weight > 0 && (
                            <div className="bg-black-50 p-3 rounded border">
                              <div className="font-medium text-green-800 flex items-center gap-2">
                                <Apple className="w-4 h-4" />
                                Fuerte Avocado
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-xs text-gray-500">Weight</div>
                                  <div className="font-bold">{selectedSupplier.fuerte_weight} kg</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Crates</div>
                                  <div className="font-bold">{selectedSupplier.fuerte_crates}</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {selectedSupplier.hass_weight > 0 && (
                            <div className="bg-black-50 p-3 rounded border">
                              <div className="font-medium text-purple-800 flex items-center gap-2">
                                <Apple className="w-4 h-4" />
                                Hass Avocado
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-xs text-gray-500">Weight</div>
                                  <div className="font-bold">{selectedSupplier.hass_weight} kg</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Crates</div>
                                  <div className="font-bold">{selectedSupplier.hass_crates}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {selectedQC && (
                          <div>
                            <div className="text-sm text-gray-500 mb-2">QC Results</div>
                            <div className="flex gap-3">
                              {selectedQC.fuerte_overall > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Fuerte: {selectedQC.fuerte_overall}%
                                </Badge>
                              )}
                              {selectedQC.hass_overall > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Hass: {selectedQC.hass_overall}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                                                
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            Supplier Payment Details
                          </h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="supplier_phone" className="mb-2 flex items-center gap-2">
                                  <Smartphone className="w-4 h-4" />
                                  Phone Number
                                </Label>
                                <Input
                                  id="supplier_phone"
                                  value={countingForm.supplier_phone}
                                  onChange={(e) => handleInputChange('supplier_phone', e.target.value)}
                                  placeholder="Enter supplier phone number"
                                />
                              </div>
                              <div>
                                <Label htmlFor="kra_pin" className="mb-2 flex items-center gap-2">
                                  <Fingerprint className="w-4 h-4" />
                                  KRA PIN
                                </Label>
                                <Input
                                  id="kra_pin"
                                  value={countingForm.kra_pin}
                                  onChange={(e) => handleInputChange('kra_pin', e.target.value)}
                                  placeholder="Enter KRA PIN"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="bank_name" className="mb-2 flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                Bank Name
                              </Label>
                              <Input
                                id="bank_name"
                                value={countingForm.bank_name}
                                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                                placeholder="Enter bank name"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="bank_account" className="mb-2 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Bank Account Number
                              </Label>
                                <Input
                                  id="bank_account"
                                  value={countingForm.bank_account}
                                  onChange={(e) => handleInputChange('bank_account', e.target.value)}
                                  placeholder="Enter account number"
                                />
                            </div>
                          </div>
                        </div>
                        
                        <Collapsible className="mt-4 border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-black-50 hover:bg-black-100 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                <span className="font-medium">View Supplier Information from Intake</span>
                              </div>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4">
                            <div className="space-y-3 text-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-gray-500">Driver Name</div>
                                  <div className="font-medium">{selectedSupplier.driver_name}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Vehicle Plate</div>
                                  <div className="font-medium">{selectedSupplier.vehicle_plate}</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500">Intake Date</div>
                                <div className="font-medium">{formatDate(selectedSupplier.timestamp)}</div>
                              </div>
                              {selectedSupplier.supplier_phone && (
                                <div>
                                  <div className="text-gray-500">Phone</div>
                                  <div className="font-medium">{selectedSupplier.supplier_phone}</div>
                                </div>
                              )}
                              {selectedSupplier.bank_name && (
                                <div>
                                  <div className="text-gray-500">Bank</div>
                                  <div className="font-medium">{selectedSupplier.bank_name}</div>
                                </div>
                              )}
                              {selectedSupplier.kra_pin && (
                                <div>
                                  <div className="text-gray-500">KRA PIN</div>
                                  <div className="font-medium">{selectedSupplier.kra_pin}</div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                        
                        {/* Cancel Edit Button */}
                        {isEditingMode && (
                          <div className="mt-4 pt-4 border-t">
                            <Button
                              onClick={() => {
                                setIsEditingMode(false);
                                setEditingRecord(null);
                                setSelectedSupplier(null);
                                setSelectedQC(null);
                                setSelectedSupplierDetails(null);
                                
                                const resetForm: CountingFormData = {
                                  supplier_id: '',
                                  supplier_name: '',
                                  supplier_phone: '',
                                  region: '',
                                  fruits: [],
                                  fuerte_4kg_class1_size12: 0,
                                  fuerte_4kg_class1_size14: 0,
                                  fuerte_4kg_class1_size16: 0,
                                  fuerte_4kg_class1_size18: 0,
                                  fuerte_4kg_class1_size20: 0,
                                  fuerte_4kg_class1_size22: 0,
                                  fuerte_4kg_class1_size24: 0,
                                  fuerte_4kg_class1_size26: 0,
                                  fuerte_4kg_class2_size12: 0,
                                  fuerte_4kg_class2_size14: 0,
                                  fuerte_4kg_class2_size16: 0,
                                  fuerte_4kg_class2_size18: 0,
                                  fuerte_4kg_class2_size20: 0,
                                  fuerte_4kg_class2_size22: 0,
                                  fuerte_4kg_class2_size24: 0,
                                  fuerte_4kg_class2_size26: 0,
                                  fuerte_10kg_class1_size12: 0,
                                  fuerte_10kg_class1_size14: 0,
                                  fuerte_10kg_class1_size16: 0,
                                  fuerte_10kg_class1_size18: 0,
                                  fuerte_10kg_class1_size20: 0,
                                  fuerte_10kg_class1_size22: 0,
                                  fuerte_10kg_class1_size24: 0,
                                  fuerte_10kg_class1_size26: 0,
                                  fuerte_10kg_class1_size28: 0,
                                  fuerte_10kg_class1_size30: 0,
                                  fuerte_10kg_class1_size32: 0,
                                  fuerte_10kg_class2_size12: 0,
                                  fuerte_10kg_class2_size14: 0,
                                  fuerte_10kg_class2_size16: 0,
                                  fuerte_10kg_class2_size18: 0,
                                  fuerte_10kg_class2_size20: 0,
                                  fuerte_10kg_class2_size22: 0,
                                  fuerte_10kg_class2_size24: 0,
                                  fuerte_10kg_class2_size26: 0,
                                  fuerte_10kg_class2_size28: 0,
                                  fuerte_10kg_class2_size30: 0,
                                  fuerte_10kg_class2_size32: 0,
                                  hass_4kg_class1_size12: 0,
                                  hass_4kg_class1_size14: 0,
                                  hass_4kg_class1_size16: 0,
                                  hass_4kg_class1_size18: 0,
                                  hass_4kg_class1_size20: 0,
                                  hass_4kg_class1_size22: 0,
                                  hass_4kg_class1_size24: 0,
                                  hass_4kg_class1_size26: 0,
                                  hass_4kg_class2_size12: 0,
                                  hass_4kg_class2_size14: 0,
                                  hass_4kg_class2_size16: 0,
                                  hass_4kg_class2_size18: 0,
                                  hass_4kg_class2_size20: 0,
                                  hass_4kg_class2_size22: 0,
                                  hass_4kg_class2_size24: 0,
                                  hass_4kg_class2_size26: 0,
                                  hass_10kg_class1_size12: 0,
                                  hass_10kg_class1_size14: 0,
                                  hass_10kg_class1_size16: 0,
                                  hass_10kg_class1_size18: 0,
                                  hass_10kg_class1_size20: 0,
                                  hass_10kg_class1_size22: 0,
                                  hass_10kg_class1_size24: 0,
                                  hass_10kg_class1_size26: 0,
                                  hass_10kg_class1_size28: 0,
                                  hass_10kg_class1_size30: 0,
                                  hass_10kg_class1_size32: 0,
                                  hass_10kg_class2_size12: 0,
                                  hass_10kg_class2_size14: 0,
                                  hass_10kg_class2_size16: 0,
                                  hass_10kg_class2_size18: 0,
                                  hass_10kg_class2_size20: 0,
                                  hass_10kg_class2_size22: 0,
                                  hass_10kg_class2_size24: 0,
                                  hass_10kg_class2_size26: 0,
                                  hass_10kg_class2_size28: 0,
                                  hass_10kg_class2_size30: 0,
                                  hass_10kg_class2_size32: 0,
                                  notes: '',
                                  bank_name: '',
                                  bank_account: '',
                                  kra_pin: '',
                                };
                                
                                setCountingForm(resetForm);
                                
                                setExpandedFuerteClass2(false);
                                setExpandedFuerte10kg(false);
                                setExpandedHassClass2(false);
                                setExpandedHass10kg(false);
                                
                                toast({
                                  title: "Edit Cancelled",
                                  description: "Returned to normal counting mode",
                                });
                              }}
                              variant="outline"
                              className="w-full"
                            >
                              Cancel Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No supplier selected</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {isEditingMode 
                            ? 'Error loading supplier for editing'
                            : 'Select a QC-approved supplier from the Quality Control tab to begin counting, or edit an existing record from History tab'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      {isEditingMode ? 'Edit Box Counting Form' : 'Box Counting Form'}
                    </CardTitle>
                    <CardDescription>
                      {isEditingMode 
                        ? 'Update number of boxes per size and class. Changes will replace the existing record.'
                        : 'Enter number of boxes per size and class. Class 1 (4kg) is default.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={isEditingMode ? handleUpdateCountingForm : handleSubmitCountingForm} className="space-y-6">
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4 text-green-700 border-b pb-2">Fuerte Avocado</h3>
                          
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-green-600">4kg Boxes - Class 1</h4>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Default
                              </Badge>
                            </div>
                            {renderSizeGrid('fuerte', '4kg', 'class1')}
                            <div className="text-right text-sm mt-2">
                              <span className="font-medium">Sub-Total: </span>
                              <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class1', '4kg')} boxes</span>
                            </div>
                          </div>

                          {renderCollapsibleSection(
                            "Fuerte 4kg Boxes - Class 2",
                            expandedFuerteClass2,
                            () => setExpandedFuerteClass2(!expandedFuerteClass2),
                            <>
                              {renderSizeGrid('fuerte', '4kg', 'class2')}
                              <div className="text-right text-sm mt-2">
                                <span className="font-medium">Sub-Total: </span>
                                <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class2', '4kg')} boxes</span>
                              </div>
                            </>,
                            "Secondary quality boxes"
                          )}

                          {renderCollapsibleSection(
                            "Fuerte 10kg Crates",
                            expandedFuerte10kg,
                            () => setExpandedFuerte10kg(!expandedFuerte10kg),
                            <>
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 1</h5>
                                {renderSizeGrid('fuerte', '10kg', 'class1')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class1', '10kg')} crates</span>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 2</h5>
                                {renderSizeGrid('fuerte', '10kg', 'class2')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class2', '10kg')} crates</span>
                                </div>
                              </div>
                            </>,
                            "Large crates (Class 1 & Class 2)"
                          )}

                          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-green-800">Fuerte Total 4kg:</span>
                              <span className="font-bold text-lg text-green-900">{calculateTotalBoxes('fuerte', '4kg')} boxes</span>
                            </div>
                            {calculateTotalBoxes('fuerte', '10kg') > 0 && (
                              <div className="flex justify-between items-center mt-2">
                                <span className="font-semibold text-green-800">Fuerte Total 10kg:</span>
                                <span className="font-bold text-lg text-green-900">{calculateTotalBoxes('fuerte', '10kg')} crates</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-300">
                              <span className="font-bold text-green-900">Fuerte Total All:</span>
                              <span className="font-bold text-xl text-green-900">
                                {calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('fuerte', '10kg')} boxes/crates
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4 text-purple-700 border-b pb-2">Hass Avocado</h3>
                          
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-purple-600">4kg Boxes - Class 1</h4>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                Default
                              </Badge>
                            </div>
                            {renderSizeGrid('hass', '4kg', 'class1')}
                            <div className="text-right text-sm mt-2">
                              <span className="font-medium">Sub-Total: </span>
                              <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class1', '4kg')} boxes</span>
                            </div>
                          </div>

                          {renderCollapsibleSection(
                            "Hass 4kg Boxes - Class 2",
                            expandedHassClass2,
                            () => setExpandedHassClass2(!expandedHassClass2),
                            <>
                              {renderSizeGrid('hass', '4kg', 'class2')}
                              <div className="text-right text-sm mt-2">
                                <span className="font-medium">Sub-Total: </span>
                                <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class2', '4kg')} boxes</span>
                              </div>
                            </>,
                            "Secondary quality boxes"
                          )}

                          {renderCollapsibleSection(
                            "Hass 10kg Crates",
                            expandedHass10kg,
                            () => setExpandedHass10kg(!expandedHass10kg),
                            <>
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 1</h5>
                                {renderSizeGrid('hass', '10kg', 'class1')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class1', '10kg')} crates</span>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 2</h5>
                                {renderSizeGrid('hass', '10kg', 'class2')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class2', '10kg')} crates</span>
                                </div>
                              </div>
                            </>,
                            "Large crates (Class 1 & Class 2)"
                          )}

                          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-purple-800">Hass Total 4kg:</span>
                              <span className="font-bold text-lg text-purple-900">{calculateTotalBoxes('hass', '4kg')} boxes</span>
                            </div>
                            {calculateTotalBoxes('hass', '10kg') > 0 && (
                              <div className="flex justify-between items-center mt-2">
                                <span className="font-semibold text-purple-800">Hass Total 10kg:</span>
                                <span className="font-bold text-lg text-purple-900">{calculateTotalBoxes('hass', '10kg')} crates</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-300">
                              <span className="font-bold text-purple-900">Hass Total All:</span>
                              <span className="font-bold text-xl text-purple-900">
                                {calculateTotalBoxes('hass', '4kg') + calculateTotalBoxes('hass', '10kg')} boxes/crates
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-3">Overall Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-blue-600">Fuerte Total Boxes:</div>
                              <div className="font-bold text-blue-800">
                                {calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('fuerte', '10kg')}
                              </div>
                            </div>
                            <div>
                              <div className="text-purple-600">Hass Total Boxes:</div>
                              <div className="font-bold text-purple-800">
                                {calculateTotalBoxes('hass', '4kg') + calculateTotalBoxes('hass', '10kg')}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-300">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-900">Total All Boxes/Crates:</span>
                              <span className="font-bold text-2xl text-blue-900">
                                {calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('fuerte', '10kg') + 
                                 calculateTotalBoxes('hass', '4kg') + calculateTotalBoxes('hass', '10kg')}
                              </span>
                            </div>
                            <div className="text-right text-xs text-blue-600 mt-1">
                              Estimated Weight: {(calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('hass', '4kg')) * 4 + 
                                              (calculateTotalBoxes('fuerte', '10kg') + calculateTotalBoxes('hass', '10kg')) * 10} kg
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <Label htmlFor="notes" className="mb-2">Notes</Label>
                          <Input
                            id="notes"
                            value={countingForm.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Additional notes (optional)"
                          />
                        </div>
                      </ScrollArea>

                      <div className="pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={!selectedSupplier}
                          className={`w-full ${isEditingMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                          size="lg"
                        >
                          {isEditingMode ? (
                            <>
                              <Edit className="w-4 h-4 mr-2" />
                              Update Counting Data
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Save Counting Data to History
                            </>
                          )}
                        </Button>
                        
                        {isEditingMode && (
                          <p className="text-sm text-blue-600 mt-2 text-center">
                            This will replace the existing counting record with updated values
                          </p>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Counting History & Export
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadFilteredHistory}
                        disabled={filteredHistory.length === 0 || isLoading.counting}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Filtered
                      </Button>
                      <Button
                        onClick={downloadAllHistory}
                        disabled={countingRecords.length === 0 || isLoading.counting}
                        variant="outline"
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export All
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {filteredHistory.length} completed counting record(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="search-history">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="search-history"
                            placeholder="Search by supplier, pallet ID, or region..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                          {searchTerm && (
                            <button
                              onClick={clearSearchFilter}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredHistory.length} of {countingRecords.length} records
                        {(startDate || endDate) && ' • Date filter applied'}
                        {searchTerm && ' • Search filter applied'}
                      </div>
                      <div className="flex gap-2">
                        {(startDate || endDate) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearDateFilter}
                          >
                            <Filter className="w-4 h-4 mr-2" />
                            Clear Dates
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchAllData}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[500px] pr-4">
                    {isLoading.counting ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading history...</p>
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No counting history found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchTerm || startDate || endDate ? 'Try adjusting your filters' : 'Completed counting records will appear here'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredHistory.map((record) => {
                          const boxesSummary = getBoxesSummary(record.totals);
                          const supplierInfo = getSupplierInfoFromCountingData(record.counting_data);
                          const isExpanded = expandedHistory.has(record.id);
                          const hasFuerte = record.fuerte_4kg_total + record.fuerte_10kg_total > 0;
                          const hasHass = record.hass_4kg_total + record.hass_10kg_total > 0;
                          const hasRejection = record.rejected_weight && record.rejected_weight > 0;
                          
                          return (
                            <Collapsible
                              key={record.id}
                              open={isExpanded}
                              onOpenChange={() => toggleHistoryExpansion(record.id)}
                              className="border rounded-lg overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold">{record.supplier_name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>Pallet: {record.pallet_id}</span>
                                        <span>Boxes: {boxesSummary.total} boxes</span>
                                        <span>Weight: {safeToFixed(record.total_counted_weight)} kg</span>
                                        {hasRejection && (
                                          <span className="text-red-600">
                                            Rejected: {safeToFixed(record.rejected_weight)} kg
                                          </span>
                                        )}
                                        <span>{formatDate(record.submitted_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* NEW: Edit Button */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await handleEditCountingRecord(record);
                                      }}
                                      className="gap-2"
                                    >
                                    <Edit className="w-4 h-4" />
                                      
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await downloadWarehouseGRN(record);
                                      }}
                                      className="gap-2"
                                    >
                                      <FileText className="w-4 h-4" />
                                      GRN
                                    </Button>
                                    <div className="flex gap-1">
                                      {hasFuerte && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          Fuerte: {record.fuerte_4kg_total + record.fuerte_10kg_total}
                                        </Badge>
                                      )}
                                      {hasHass && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                          Hass: {record.hass_4kg_total + record.hass_10kg_total}
                                        </Badge>
                                      )}
                                      {hasRejection && (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                          Rejected: {safeToFixed(record.rejected_weight)} kg
                                        </Badge>
                                      )}
                                    </div>
                                    <Badge variant="outline" className={
                                      record.for_coldroom && record.status === 'pending_coldroom' 
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : record.status === 'completed'
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                    }>
                                      {record.for_coldroom && record.status === 'pending_coldroom' 
                                        ? 'Ready for Cold Room'
                                        : record.status === 'completed'
                                        ? 'Loaded to Cold Room'
                                        : 'Pending'}
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-black border-t">
                                <div className="space-y-4">
                                  <div className="bg-black-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-3">Supplier Information</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <div className="text-gray-500">Supplier Name</div>
                                        <div className="font-semibold">{record.supplier_name}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Phone Number</div>
                                        <div className="font-medium">{record.supplier_phone || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Region</div>
                                        <div className="font-medium">{record.region}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Pallet ID</div>
                                        <div className="font-medium">{record.pallet_id}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Driver</div>
                                        <div className="font-medium">{record.driver_name || supplierInfo.driver_name || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Vehicle Plate</div>
                                        <div className="font-medium">{record.vehicle_plate || supplierInfo.vehicle_plate || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Processed By</div>
                                        <div className="font-medium">{record.processed_by}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Date</div>
                                        <div className="font-medium">{formatDate(record.submitted_at)}</div>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <h5 className="font-semibold mb-2 text-gray-700">Payment Details</h5>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <div className="text-gray-500">Bank Name</div>
                                          <div className="font-medium">{record.bank_name || 'N/A'}</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500">Account Number</div>
                                          <div className="font-medium">{record.bank_account || 'N/A'}</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500">KRA PIN</div>
                                          <div className="font-medium">{record.kra_pin || 'N/A'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Intake Weight</div>
                                      <div className="font-bold text-lg">{record.total_weight} kg</div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Counted Weight</div>
                                      <div className="font-bold text-lg">{safeToFixed(record.total_counted_weight)} kg</div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Rejected Weight</div>
                                      <div className="font-bold text-lg">{safeToFixed(record.rejected_weight || 0)} kg</div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Weight Variance</div>
                                      <div className={`font-bold text-lg ${
                                        (record.total_weight - (record.total_counted_weight || 0) - (record.rejected_weight || 0)) > 0 
                                          ? 'text-red-600' 
                                          : 'text-green-600'
                                      }`}>
                                        {safeToFixed(record.total_weight - (record.total_counted_weight || 0) - (record.rejected_weight || 0))} kg
                                      </div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Status</div>
                                      <div className={`font-bold text-lg ${
                                        record.for_coldroom && record.status === 'pending_coldroom' 
                                          ? 'text-green-700'
                                          : record.status === 'completed'
                                          ? 'text-blue-700'
                                          : 'text-gray-700'
                                      }`}>
                                        {record.for_coldroom && record.status === 'pending_coldroom' 
                                          ? 'Ready for Cold Room'
                                          : record.status === 'completed'
                                          ? 'Loaded to Cold Room'
                                          : record.status}
                                      </div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Cold Room Ready</div>
                                      <div className="font-bold text-lg">
                                        {record.for_coldroom ? 'Yes' : 'No'}
                                      </div>
                                    </div>
                                  </div>

                                  {record.rejected_weight > 0 && (
                                    <div className="bg-black-50 p-4 rounded-lg border border-red-200">
                                      <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Rejection Details
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                          <div className="text-sm text-gray-600">Rejected Weight</div>
                                          <div className="text-xl font-bold text-red-700">
                                            {safeToFixed(record.rejected_weight, 2)} kg
                                          </div>
                                          <div className="text-xs text-red-600">
                                            {((record.rejected_weight / record.total_weight) * 100).toFixed(1)}% of intake
                                          </div>
                                        </div>
                                        {record.rejection_reason && (
                                          <div className="col-span-2">
                                            <div className="text-sm text-gray-600">Rejection Reason</div>
                                            <div className="font-medium">{record.rejection_reason}</div>
                                          </div>
                                        )}
                                      </div>
                                      {record.rejection_notes && (
                                        <div className="mt-3 pt-3 border-t border-red-200">
                                          <div className="text-sm text-gray-600">Notes</div>
                                          <div className="text-sm">{record.rejection_notes}</div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="bg-black-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-3">Variety Breakdown</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {hasFuerte && (
                                        <div className="bg-black-50 p-3 rounded border">
                                          <h5 className="font-semibold text-green-800 mb-2">Fuerte Avocado</h5>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <div className="text-xs text-gray-500">4kg Boxes</div>
                                              <div className="font-bold">{record.fuerte_4kg_total}</div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500">10kg Crates</div>
                                              <div className="font-bold">{record.fuerte_10kg_total}</div>
                                            </div>
                                            <div className="col-span-2">
                                              <div className="text-xs text-gray-500">Total Weight</div>
                                              <div className="font-bold text-green-700">
                                                {(record.fuerte_4kg_total * 4 + record.fuerte_10kg_total * 10).toFixed(1)} kg
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {hasHass && (
                                        <div className="bg-black-50 p-3 rounded border">
                                          <h5 className="font-semibold text-purple-800 mb-2">Hass Avocado</h5>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <div className="text-xs text-gray-500">4kg Boxes</div>
                                              <div className="font-bold">{record.hass_4kg_total}</div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500">10kg Crates</div>
                                              <div className="font-bold">{record.hass_10kg_total}</div>
                                            </div>
                                            <div className="col-span-2">
                                              <div className="text-xs text-gray-500">Total Weight</div>
                                              <div className="font-bold text-purple-700">
                                                {(record.hass_4kg_total * 4 + record.hass_10kg_total * 10).toFixed(1)} kg
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div>
                                      <h4 className="font-semibold mb-3">Detailed Box Breakdown</h4>
                                      {renderBoxesBreakdown(record)}
                                    </div>
                                  )}

                                  {record.notes && (
                                    <div>
                                      <div className="text-gray-500 mb-2">Notes</div>
                                      <div className="bg-black-50 p-3 rounded border text-sm">
                                        {record.notes}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-between pt-4 border-t">
                                    <Button
                                      onClick={() => handleEditCountingRecord(record)}
                                      className="gap-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Counting Data
                                    </Button>
                                    <Button
                                      onClick={async () => {
                                        await downloadWarehouseGRN(record);
                                      }}
                                      className="gap-2"
                                    >
                                      <FileDown className="w-4 h-4" />
                                      Download Complete GRN
                                    </Button>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Box Size Statistics
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of all box sizes and classes from {countingRecords.length} counting records
                    {isLoading.stats && <span className="ml-2">(Loading...)</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Total Fuerte Boxes</div>
                          <Apple className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-700">{sizeTotals.fuerte.overall}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <div className="flex justify-between">
                            <span>4kg: {sizeTotals.fuerte['4kg'].total}</span>
                            <span>10kg: {sizeTotals.fuerte['10kg'].total}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Total Hass Boxes</div>
                          <Apple className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-700">{sizeTotals.hass.overall}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <div className="flex justify-between">
                            <span>4kg: {sizeTotals.hass['4kg'].total}</span>
                            <span>10kg: {sizeTotals.hass['10kg'].total}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Class 1 Boxes</div>
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                          {sizeTotals.fuerte['4kg'].class1 + sizeTotals.fuerte['10kg'].class1 + 
                           sizeTotals.hass['4kg'].class1 + sizeTotals.hass['10kg'].class1}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Premium Quality</div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Class 2 Boxes</div>
                          <Package className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-yellow-700">
                          {sizeTotals.fuerte['4kg'].class2 + sizeTotals.fuerte['10kg'].class2 + 
                           sizeTotals.hass['4kg'].class2 + sizeTotals.hass['10kg'].class2}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Standard Quality</div>
                      </div>
                    </div>

                    {/* Fuerte Avocado Statistics */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                        <Apple className="w-5 h-5" />
                        Fuerte Avocado Statistics
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Fuerte 4kg Table */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-green-100 p-3 border-b">
                            <h4 className="font-semibold text-green-800">Fuerte 4kg Boxes</h4>
                            <div className="text-sm text-green-700">
                              Total: {sizeTotals.fuerte['4kg'].total} boxes (Class 1: {sizeTotals.fuerte['4kg'].class1}, Class 2: {sizeTotals.fuerte['4kg'].class2})
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">Size</TableHead>
                                  <TableHead className="text-center">Class 1</TableHead>
                                  <TableHead className="text-center">Class 2</TableHead>
                                  <TableHead className="text-center">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {['12', '14', '16', '18', '20', '22', '24', '26'].map(size => {
                                  const class1 = sizeStatistics.fuerte['4kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
                                  const class2 = sizeStatistics.fuerte['4kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
                                  const total = class1 + class2;
                                  
                                  return (
                                    <TableRow key={size}>
                                      <TableCell className="font-medium">Size {size}</TableCell>
                                      <TableCell className="text-center">
                                        {class1 > 0 ? (
                                          <Badge variant="outline" className="bg-green-50 text-green-700">
                                            {class1}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {class2 > 0 ? (
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                            {class2}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center font-bold">
                                        {total > 0 ? total : '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Fuerte 10kg Table */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-green-100 p-3 border-b">
                            <h4 className="font-semibold text-green-800">Fuerte 10kg Crates</h4>
                            <div className="text-sm text-green-700">
                              Total: {sizeTotals.fuerte['10kg'].total} crates (Class 1: {sizeTotals.fuerte['10kg'].class1}, Class 2: {sizeTotals.fuerte['10kg'].class2})
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">Size</TableHead>
                                  <TableHead className="text-center">Class 1</TableHead>
                                  <TableHead className="text-center">Class 2</TableHead>
                                  <TableHead className="text-center">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'].map(size => {
                                  const class1 = sizeStatistics.fuerte['10kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
                                  const class2 = sizeStatistics.fuerte['10kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
                                  const total = class1 + class2;
                                  
                                  return (
                                    <TableRow key={size}>
                                      <TableCell className="font-medium">Size {size}</TableCell>
                                      <TableCell className="text-center">
                                        {class1 > 0 ? (
                                          <Badge variant="outline" className="bg-green-50 text-green-700">
                                            {class1}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {class2 > 0 ? (
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                            {class2}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center font-bold">
                                        {total > 0 ? total : '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hass Avocado Statistics */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                        <Apple className="w-5 h-5" />
                        Hass Avocado Statistics
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Hass 4kg Table */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-purple-100 p-3 border-b">
                            <h4 className="font-semibold text-purple-800">Hass 4kg Boxes</h4>
                            <div className="text-sm text-purple-700">
                              Total: {sizeTotals.hass['4kg'].total} boxes (Class 1: {sizeTotals.hass['4kg'].class1}, Class 2: {sizeTotals.hass['4kg'].class2})
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">Size</TableHead>
                                  <TableHead className="text-center">Class 1</TableHead>
                                  <TableHead className="text-center">Class 2</TableHead>
                                  <TableHead className="text-center">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {['12', '14', '16', '18', '20', '22', '24', '26'].map(size => {
                                  const class1 = sizeStatistics.hass['4kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
                                  const class2 = sizeStatistics.hass['4kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
                                  const total = class1 + class2;
                                  
                                  return (
                                    <TableRow key={size}>
                                      <TableCell className="font-medium">Size {size}</TableCell>
                                      <TableCell className="text-center">
                                        {class1 > 0 ? (
                                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                            {class1}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {class2 > 0 ? (
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                            {class2}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center font-bold">
                                        {total > 0 ? total : '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Hass 10kg Table */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-purple-100 p-3 border-b">
                            <h4 className="font-semibold text-purple-800">Hass 10kg Crates</h4>
                            <div className="text-sm text-purple-700">
                              Total: {sizeTotals.hass['10kg'].total} crates (Class 1: {sizeTotals.hass['10kg'].class1}, Class 2: {sizeTotals.hass['10kg'].class2})
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">Size</TableHead>
                                  <TableHead className="text-center">Class 1</TableHead>
                                  <TableHead className="text-center">Class 2</TableHead>
                                  <TableHead className="text-center">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'].map(size => {
                                  const class1 = sizeStatistics.hass['10kg'][`size${size}_class1` as keyof VarietySizeStats] || 0;
                                  const class2 = sizeStatistics.hass['10kg'][`size${size}_class2` as keyof VarietySizeStats] || 0;
                                  const total = class1 + class2;
                                  
                                  return (
                                    <TableRow key={size}>
                                      <TableCell className="font-medium">Size {size}</TableCell>
                                      <TableCell className="text-center">
                                        {class1 > 0 ? (
                                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                            {class1}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {class2 > 0 ? (
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                            {class2}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">0</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center font-bold">
                                        {total > 0 ? total : '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rejection Statistics */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-red-50 p-3 border-b">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-semibold text-red-800">Rejection Statistics</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-700">
                              {countingRecords.filter(r => r.rejected_weight && r.rejected_weight > 0).length}
                            </div>
                            <div className="text-sm text-gray-600">Records with Rejections</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-700">
                              {safeToFixed(countingRecords.reduce((sum, r) => sum + (r.rejected_weight || 0), 0), 1)} kg
                            </div>
                            <div className="text-sm text-gray-600">Total Rejected Weight</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-700">
                              {stats.weight_summary ? safeToFixed((stats.weight_summary.total_rejected_weight / stats.weight_summary.total_intake_weight) * 100, 2) : '0'}%
                            </div>
                            <div className="text-sm text-gray-600">Average Rejection Rate</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Debug Information */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Data Information</h4>
                      <div className="text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="font-medium">Total Counting Records:</div>
                            <div>{countingRecords.length}</div>
                          </div>
                          <div>
                            <div className="font-medium">Total Rejects Records:</div>
                            <div>{rejects.length}</div>
                          </div>
                          <div>
                            <div className="font-medium">Last Updated:</div>
                            <div>{lastRefreshed ? format(lastRefreshed, 'PPpp') : 'Never'}</div>
                          </div>
                          <div>
                            <div className="font-medium">Integration Status:</div>
                            <div className="text-green-600 font-medium">Active</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button
                            onClick={() => {
                              console.log('Debug Size Statistics:', {
                                countingRecords: countingRecords.length,
                                rejects: rejects.length,
                                sizeStatistics,
                                sampleRecord: countingRecords[0]?.counting_data
                                  ? Object.keys(countingRecords[0].counting_data).filter(k => k.includes('size'))
                                  : 'No counting_data',
                                sampleReject: rejects[0] || 'No rejects'
                              });
                              toast({
                                title: 'Debug Info Logged',
                                description: 'Check console for size statistics details',
                              });
                            }}
                            size="sm"
                            variant="outline"
                            className="mt-2"
                          >
                            Debug Size Data
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Export Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          const statsData = {
                            summary: {
                              total_records: countingRecords.length,
                              total_rejections: rejects.length,
                              total_fuerte_boxes: sizeTotals.fuerte.overall,
                              total_hass_boxes: sizeTotals.hass.overall,
                              total_class1: sizeTotals.fuerte['4kg'].class1 + sizeTotals.fuerte['10kg'].class1 + 
                                         sizeTotals.hass['4kg'].class1 + sizeTotals.hass['10kg'].class1,
                              total_class2: sizeTotals.fuerte['4kg'].class2 + sizeTotals.fuerte['10kg'].class2 + 
                                         sizeTotals.hass['4kg'].class2 + sizeTotals.hass['10kg'].class2,
                              total_rejected_weight: stats.weight_summary?.total_rejected_weight || 0,
                              grand_total: sizeTotals.grandTotal,
                              generated_at: new Date().toISOString()
                            },
                            fuerte_4kg: sizeStatistics.fuerte['4kg'],
                            fuerte_10kg: sizeStatistics.fuerte['10kg'],
                            hass_4kg: sizeStatistics.hass['4kg'],
                            hass_10kg: sizeStatistics.hass['10kg'],
                            totals: sizeTotals,
                            sample_size_data: countingRecords.length > 0 
                              ? Object.keys(countingRecords[0].counting_data || {}).filter(k => k.includes('size')).slice(0, 5)
                              : []
                          };

                          const dataStr = JSON.stringify(statsData, null, 2);
                          const dataBlob = new Blob([dataStr], { type: 'application/json' });
                          const url = URL.createObjectURL(dataBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `box_size_statistics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
                          link.click();
                          URL.revokeObjectURL(url);

                          toast({
                            title: 'Statistics Exported',
                            description: 'Box size statistics have been downloaded as JSON',
                          });
                        }}
                        className="gap-2"
                        disabled={countingRecords.length === 0}
                      >
                        <Download className="w-4 h-4" />
                        Export Statistics (JSON)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}