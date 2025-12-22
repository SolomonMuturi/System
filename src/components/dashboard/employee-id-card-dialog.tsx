
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FreshTraceLogo } from '@/components/icons';
import { Printer, CreditCard, Edit } from 'lucide-react';
import type { Employee } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';

interface EmployeeIdCardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onEdit: () => void;
}

export function EmployeeIdCardDialog({ isOpen, onOpenChange, employee, onEdit }: EmployeeIdCardDialogProps) {
  if (!employee) return null;

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/employees/profile/${employee.id}` : '';
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const handlePrint = () => {
    const printContent = document.getElementById('printable-id-card-area');
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50,top=50,width=800,height=600');

    if (printWindow && printContent) {
        printWindow.document.write('<html><head><title>Print Employee ID</title>');
        printWindow.document.write(`
            <style>
                @media print {
                    @page { size: 85.6mm 53.98mm; margin: 0; }
                    body { margin: 0; }
                }
                body { font-family: sans-serif; }
                .id-card {
                    width: 85.6mm;
                    height: 53.98mm;
                    border: 1px solid #eee;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    background: white;
                    color: black;
                }
                .id-header { 
                    background-color: #0f172a; 
                    color: white; 
                    padding: 4px 8px; 
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    text-align: center;
                    gap: 4px;
                }
                .id-logo { width: 24px; height: 24px; flex-shrink: 0; color: #22c55e; }
                .id-company-details { font-size: 8px; }
                .id-company-details p { margin: 0; line-height: 1.2; }
                .id-company { font-weight: bold; font-size: 10px; }
                .id-content { 
                    flex-grow: 1; 
                    display: flex; 
                    gap: 12px; 
                    padding: 8px;
                }
                .id-avatar-container { text-align: center; }
                .id-avatar { width: 80px; height: 80px; border: 2px solid #eee; }
                .id-details { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
                .id-name { font-size: 14px; font-weight: bold; margin: 0; }
                .id-role { font-size: 11px; color: #666; margin: 0; }
                .id-qr-code { width: 70px; height: 70px; }
                .id-info-grid { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
                .id-footer { display: flex; justify-content: space-between; font-size: 9px; padding: 4px 8px; font-weight: bold; color: #22c55e; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg non-printable">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <CreditCard />
                Employee ID Card
            </DialogTitle>
            <DialogDescription>
              A printable ID card for {employee.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div id="printable-id-card-area-display" className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
             {/* This is a replica for display, the one below is for printing */}
            <div className="id-card-display" style={{ width: '3.37in', height: '2.125in', transform: 'scale(1.2)' }}>
                <div className="id-card" style={{ width: '85.6mm', height: '53.98mm', border: '1px solid #eee', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', color: 'black' }}>
                    <div className="id-header" style={{ backgroundColor: '#0f172a', color: 'white', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                        <FreshTraceLogo className="id-logo" style={{ width: '24px', height: '24px', flexShrink: 0, color: '#22c55e' }} />
                        <div className="id-company-details" style={{ fontSize: '8px', lineHeight: 1.2 }}>
                            <p className="id-company" style={{ fontWeight: 'bold', fontSize: '10px' }}>Harir Int.</p>
                            <p>P.O. Box 12345 - 00100, Nairobi | Tel: +254 20 1234567</p>
                            <p>If found, please return to the address above.</p>
                        </div>
                    </div>
                    <div className="id-content" style={{ flexGrow: 1, display: 'flex', gap: '12px', padding: '8px' }}>
                        <div className="id-avatar-container" style={{ textAlign: 'center' }}>
                            <Avatar className="id-avatar" style={{ width: '80px', height: '80px', border: '2px solid #eee' }}>
                                <AvatarImage src={employee.image} />
                                <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="id-info-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                            <div className="id-details" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <p className="id-name" style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{employee.name}</p>
                                <p className="id-role" style={{ fontSize: '11px', color: '#666', margin: 0 }}>{employee.role}</p>
                                <p className="id-role" style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>Emp. ID: {employee.id}</p>
                            </div>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(profileUrl)}`} 
                                alt="Employee QR Code"
                                className="id-qr-code"
                                style={{ width: '70px', height: '70px' }}
                            />
                        </div>
                    </div>
                    <div className="id-footer" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', padding: '4px 8px', color: '#22c55e', fontWeight: 'bold' }}>
                        <span>Issue Date: {employee.issueDate ? format(new Date(employee.issueDate), 'MM/dd/yyyy') : 'N/A'}</span>
                        <span>Expiry Date: {employee.expiryDate ? format(new Date(employee.expiryDate), 'MM/dd/yyyy') : 'N/A'}</span>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button variant="secondary" onClick={onEdit}>
                <Edit className="mr-2" />
                Edit Details
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2" />
              Print ID Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden div for actual printing */}
      <div id="printable-id-card-area" className="hidden">
        <div className="id-card">
            <div className="id-header">
                <FreshTraceLogo className="id-logo" />
                 <div className="id-company-details">
                    <p className="id-company">Harir Int.</p>
                    <p>P.O. Box 12345 - 00100, Nairobi | Tel: +254 20 1234567</p>
                    <p>If found, please return to the address above.</p>
                </div>
            </div>
            <div className="id-content">
                <div className="id-avatar-container">
                    <img src={employee.image} alt={employee.name} className="id-avatar" style={{ width: '80px', height: '80px', border: '2px solid #eee' }} />
                </div>
                <div className="id-info-grid">
                    <div className="id-details">
                        <p className="id-name" style={{ fontSize: '14px' }}>{employee.name}</p>
                        <p className="id-role" style={{ fontSize: '11px' }}>{employee.role}</p>
                        <p className="id-role" style={{ fontSize: '10px', marginTop: '4px' }}>Emp. ID: {employee.id}</p>
                    </div>
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(profileUrl)}`} 
                        alt="Employee QR Code"
                        className="id-qr-code"
                    />
                </div>
            </div>
             <div className="id-footer">
                <span>Issue: {employee.issueDate ? format(new Date(employee.issueDate), 'MM/dd/yyyy') : 'N/A'}</span>
                <span>Expiry: {employee.expiryDate ? format(new Date(employee.expiryDate), 'MM/dd/yyyy') : 'N/A'}</span>
            </div>
        </div>
      </div>
    </>
  );
}
