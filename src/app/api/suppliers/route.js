import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { startOfDay, endOfDay } from 'date-fns'
import PDFDocument from 'pdfkit'

// Helper function to generate small ID (max ~20 chars)
function generateSmallId() {
  // Using timestamp + random 4 chars = ~14 characters
  const timestamp = Date.now().toString(36); // Base36 timestamp (~8 chars)
  const random = Math.random().toString(36).substr(2, 4); // 4 random chars
  return `s-${timestamp}-${random}`; // Example: s-khts0x8-abc1
}

// Alternative: Even smaller ID (~10 chars)
function generateTinyId() {
  // Base36 timestamp only = ~8 chars
  return `s${Date.now().toString(36)}`; // Example: skhts0x8
}

// Alternative: Short UUID (8 chars)
function generateShortId() {
  // Using part of timestamp + random
  const timePart = Date.now().toString(36).slice(-6); // Last 6 chars
  const randPart = Math.random().toString(36).substr(2, 2); // 2 random chars
  return `s${timePart}${randPart}`; // Example: sts0x8ab
}

// Helper function to generate CSV with specified columns
function generateCSV(suppliers) {
  const headers = [
    'Supplier Code',
    'Supplier Name',
    'Location',
    'Phone Number',
    'Email Number'
  ]

  const rows = suppliers.map(supplier => [
    supplier.supplier_code || 'N/A',
    supplier.name || 'N/A',
    supplier.location || 'N/A',
    supplier.contact_phone || 'N/A',
    supplier.contact_email || 'N/A'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

// Helper function to generate PDF with specified columns
async function generatePDF(suppliers, startDate, endDate) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = []
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true
      })
      
      // Handle data events
      doc.on('data', (chunk) => {
        chunks.push(chunk)
      })
      
      // Handle end event - resolve when PDF is complete
      doc.on('end', () => {
        console.log('PDF generation completed successfully')
        const pdfBuffer = Buffer.concat(chunks)
        resolve(pdfBuffer)
      })
      
      // Handle errors
      doc.on('error', (error) => {
        console.error('PDF generation error:', error)
        reject(error)
      })
      
      // --- Start building PDF content ---
      
      // Header
      doc.fontSize(20).text('Supplier Report', { align: 'center' })
      doc.moveDown()
      
      // Date range
      doc.fontSize(12)
        .text(`Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' })
      doc.moveDown()
      
      // Summary
      const totalSuppliers = suppliers.length
      const activeSuppliers = suppliers.filter(s => s.status === 'Active').length
      
      doc.fontSize(14).text('Summary', { underline: true })
      doc.fontSize(12)
        .text(`Total Suppliers: ${totalSuppliers}`)
        .text(`Active Suppliers: ${activeSuppliers}`)
      doc.moveDown()
      
      // Supplier details table
      doc.fontSize(12).text('Supplier Details:', { underline: true })
      doc.moveDown()
      
      // Simple table implementation (avoiding complex column positioning)
      suppliers.forEach((supplier, index) => {
        const registrationDate = supplier.created_at 
          ? new Date(supplier.created_at).toLocaleDateString()
          : 'N/A'
        
        doc.fontSize(10)
          .text(`Supplier Code: ${supplier.supplier_code || 'N/A'}`)
          .text(`Supplier Name: ${supplier.name || 'N/A'}`)
          .text(`Location: ${supplier.location || 'N/A'}`)
          .text(`Phone Number: ${supplier.contact_phone || 'N/A'}`)
          .text(`Registration Date: ${registrationDate}`)
          .moveDown()
        
        // Add page break if near bottom
        if (doc.y > doc.page.height - 100) {
          doc.addPage()
        }
      })
      
      // Footer
      doc.fontSize(10)
      doc.text(
        `Report generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        { align: 'center' }
      )
      
      // Finalize PDF
      doc.end()
      
    } catch (error) {
      console.error('Error in generatePDF function:', error)
      reject(error)
    }
  })
}

export async function GET(request) {
  try {
    console.log('📨 GET /api/suppliers - Fetching suppliers');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format'); // 'csv' or 'pdf'
    
    // Handle single supplier request
    if (id) {
      const supplier = await prisma.suppliers.findUnique({
        where: { id }
      });
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(supplier);
    }
    
    // Handle date range filtering for reports
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
          { status: 400 }
        );
      }
      
      console.log(`📊 Filtering suppliers by date range: ${startDate} to ${endDate}`);
      
      const suppliers = await prisma.suppliers.findMany({
        where: {
          created_at: {
            gte: startOfDay(start),
            lte: endOfDay(end)
          }
        },
        orderBy: { created_at: 'desc' }
      });
      
      console.log(`✅ Found ${suppliers.length} suppliers in date range`);
      
      // Handle export formats
      if (format === 'csv') {
        const csvContent = generateCSV(suppliers);
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=suppliers_${startDate}_to_${endDate}.csv`
          }
        });
      } else if (format === 'pdf') {
        try {
          if (suppliers.length === 0) {
            return NextResponse.json(
              { error: 'No suppliers found for the selected date range' },
              { status: 404 }
            );
          }
          
          console.log('Generating PDF report...');
          const pdfBuffer = await generatePDF(suppliers, startDate, endDate);
          
          if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Generated PDF buffer is empty');
          }
          
          console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
          
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=suppliers_report_${startDate}_to_${endDate}.pdf`
            }
          });
        } catch (pdfError) {
          console.error('❌ PDF generation error:', pdfError);
          
          // Provide a helpful error response
          const errorMessage = pdfError.message || 'Unknown PDF generation error';
          return NextResponse.json(
            { 
              error: 'Failed to generate PDF report',
              details: errorMessage,
              suggestion: 'Please try CSV export or contact support'
            },
            { status: 500 }
          );
        }
      }
      
      // Return JSON by default
      const formattedSuppliers = suppliers.map(supplier => ({
        ...supplier,
        produce_types: supplier.produce_types ? JSON.parse(supplier.produce_types) : [],
        created_at: supplier.created_at.toISOString()
      }));
      
      return NextResponse.json(formattedSuppliers);
    }
    
    // Get all suppliers (original functionality - no date filtering)
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`✅ Found ${suppliers.length} suppliers`);
    
    // Format for response
    const formattedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      produce_types: supplier.produce_types ? JSON.parse(supplier.produce_types) : [],
      created_at: supplier.created_at.toISOString()
    }));
    
    return NextResponse.json(formattedSuppliers);
  } catch (error) {
    console.error('❌ Error in GET /api/suppliers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('📨 POST /api/suppliers - Creating new supplier');
    
    const body = await request.json();
    console.log('📦 Request data:', body);
    
    // Validate required fields
    if (!body.name || !body.contact_name || !body.contact_phone || !body.supplier_code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, contact_name, contact_phone, or supplier_code' },
        { status: 400 }
      );
    }
    
    // Check if supplier code already exists
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        supplier_code: body.supplier_code
      }
    });
    
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this code already exists' },
        { status: 400 }
      );
    }
    
    // Create supplier with vehicle status fields
    const newSupplier = await prisma.suppliers.create({
      data: {
        // Using the smallest ID option (8-10 chars)
        id: generateTinyId(), // OR use generateShortId() or generateSmallId()
        name: body.name,
        location: body.location || 'Gate Registration',
        contact_name: body.contact_name,
        contact_email: body.contact_email || '',
        contact_phone: body.contact_phone,
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []),
        status: body.status || 'Active',
        logo_url: body.logo_url || `https://avatar.vercel.sh/${encodeURIComponent(body.name)}.png`,
        active_contracts: body.active_contracts || 0,
        supplier_code: body.supplier_code,
        kra_pin: body.kra_pin || null,
        vehicle_number_plate: body.vehicle_number_plate || null,
        driver_name: body.driver_name || body.contact_name || null,
        driver_id_number: body.driver_id_number || null,
        mpesa_paybill: body.mpesa_paybill || null,
        mpesa_account_number: body.mpesa_account_number || null,
        bank_name: body.bank_name || null,
        bank_account_number: body.bank_account_number || null,
        password: body.password || null,
        vehicle_status: body.vehicle_status || 'Pre-registered',
        vehicle_check_in_time: body.vehicle_check_in_time || null,
        vehicle_check_out_time: body.vehicle_check_out_time || null,
        vehicle_type: body.vehicle_type || null,
        cargo_description: body.cargo_description || null
      }
    });

    console.log('✅ Supplier created successfully:', newSupplier.id);
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating supplier:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Supplier with this email or code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing supplier ID' },
        { status: 400 }
      );
    }
    
    console.log(`📨 PUT /api/suppliers?id=${id} - Updating supplier`);
    
    const body = await request.json();
    console.log('📦 Update data:', body);
    
    // Check if supplier exists
    const existingSupplier = await prisma.suppliers.findUnique({
      where: { id }
    });
    
    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData = {
      ...(body.name && { name: body.name }),
      ...(body.contact_name && { contact_name: body.contact_name }),
      ...(body.contact_phone && { contact_phone: body.contact_phone }),
      ...(body.supplier_code && { supplier_code: body.supplier_code }),
      ...(body.location && { location: body.location }),
      ...(body.contact_email && { contact_email: body.contact_email }),
      ...(body.produce_types && { 
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []) 
      }),
      ...(body.status && { status: body.status }),
      ...(body.kra_pin !== undefined && { kra_pin: body.kra_pin }),
      ...(body.vehicle_number_plate !== undefined && { vehicle_number_plate: body.vehicle_number_plate }),
      ...(body.driver_name !== undefined && { driver_name: body.driver_name }),
      ...(body.driver_id_number !== undefined && { driver_id_number: body.driver_id_number }),
      ...(body.vehicle_status !== undefined && { vehicle_status: body.vehicle_status }),
      ...(body.vehicle_check_in_time !== undefined && { 
        vehicle_check_in_time: body.vehicle_check_in_time ? new Date(body.vehicle_check_in_time) : null 
      }),
      ...(body.vehicle_check_out_time !== undefined && { 
        vehicle_check_out_time: body.vehicle_check_out_time ? new Date(body.vehicle_check_out_time) : null 
      }),
      ...(body.vehicle_type !== undefined && { vehicle_type: body.vehicle_type }),
      ...(body.cargo_description !== undefined && { cargo_description: body.cargo_description })
    };

    const updatedSupplier = await prisma.suppliers.update({
      where: { id },
      data: updateData
    });

    console.log('✅ Supplier updated successfully:', updatedSupplier.id);
    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('❌ Error updating supplier:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier', details: error.message },
      { status: 500 }
    );
  }
}