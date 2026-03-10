import { Injectable } from '@nestjs/common';

export interface PoForPdf {
  number: string;
  version: number;
  issuedAt?: Date | null;
  paymentTerms?: string | null;
  currency: string;
  notes?: string | null;
  shippingAddress?: Record<string, any> | null;
  vendor: {
    name: string;
    code?: string | null;
    contactInfo?: Record<string, any> | null;
    address?: Record<string, any> | null;
  };
  lines: Array<{
    lineNumber: number;
    description: string;
    quantity: string;
    unitOfMeasure: string;
    unitPrice: string;
    totalPrice: string;
    glAccount?: string | null;
  }>;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
}

@Injectable()
export class PdfService {
  async generatePoPdf(po: PoForPdf): Promise<Buffer> {
    // Dynamic import to avoid issues if pdfkit not installed at module load
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const currency = po.currency || 'USD';
      const fmt = (n: string | number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n));

      // ── Header ──────────────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'right' });
      doc.fontSize(11).font('Helvetica').text(`PO Number: ${po.number}`, { align: 'right' });
      doc.text(`Version: V${po.version}`, { align: 'right' });
      if (po.issuedAt) {
        doc.text(`Issued: ${new Date(po.issuedAt).toLocaleDateString()}`, { align: 'right' });
      }
      doc.moveDown(1);

      // ── Vendor & Ship-To ──────────────────────────────────────
      const col1x = 50;
      const col2x = 300;
      const y = doc.y;

      doc.font('Helvetica-Bold').text('VENDOR', col1x, y);
      doc.font('Helvetica');
      doc.text(po.vendor.name, col1x, doc.y);
      if (po.vendor.contactInfo?.email) doc.text(po.vendor.contactInfo.email as string);
      if (po.vendor.contactInfo?.phone) doc.text(po.vendor.contactInfo.phone as string);
      if (po.vendor.address?.street) doc.text(po.vendor.address.street as string);

      doc.font('Helvetica-Bold').text('SHIP TO', col2x, y);
      doc.font('Helvetica');
      if (po.shippingAddress) {
        const addr = po.shippingAddress;
        if (addr['street']) doc.text(addr['street'] as string, col2x);
        if (addr['city']) doc.text(`${addr['city']}, ${addr['state'] || ''} ${addr['postalCode'] || ''}`, col2x);
      }

      doc.moveDown(2);

      // ── Payment terms ─────────────────────────────────────────
      if (po.paymentTerms) {
        doc.font('Helvetica-Bold').text('Payment Terms: ', { continued: true });
        doc.font('Helvetica').text(po.paymentTerms);
        doc.moveDown(0.5);
      }

      // ── Line Items Table ──────────────────────────────────────
      doc.moveDown(0.5);
      const tableTop = doc.y;
      const col = { line: 50, desc: 75, qty: 300, uom: 345, price: 390, total: 470 };

      // Table header
      doc.font('Helvetica-Bold').fontSize(9);
      doc.rect(50, tableTop - 5, 510, 18).fill('#f3f4f6').stroke('#e5e7eb');
      doc.fillColor('#111827');
      doc.text('#', col.line, tableTop);
      doc.text('Description', col.desc, tableTop);
      doc.text('Qty', col.qty, tableTop);
      doc.text('UOM', col.uom, tableTop);
      doc.text('Unit Price', col.price, tableTop);
      doc.text('Total', col.total, tableTop);

      // Table rows
      doc.font('Helvetica').fontSize(9);
      let rowY = tableTop + 20;
      for (const line of po.lines) {
        if (rowY > 680) { doc.addPage(); rowY = 50; }

        const isEven = line.lineNumber % 2 === 0;
        if (isEven) doc.rect(50, rowY - 3, 510, 16).fill('#f9fafb').stroke();
        doc.fillColor('#111827');

        doc.text(String(line.lineNumber), col.line, rowY);
        // Truncate long descriptions
        const desc = line.description.length > 45 ? line.description.slice(0, 42) + '...' : line.description;
        doc.text(desc, col.desc, rowY);
        doc.text(String(line.quantity), col.qty, rowY);
        doc.text(line.unitOfMeasure, col.uom, rowY);
        doc.text(fmt(line.unitPrice), col.price, rowY);
        doc.text(fmt(line.totalPrice), col.total, rowY);

        rowY += 18;
      }

      // ── Totals ──────────────────────────────────────────────
      rowY += 10;
      doc.moveTo(50, rowY).lineTo(560, rowY).stroke('#e5e7eb');
      rowY += 10;

      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal:', 400, rowY);
      doc.text(fmt(po.subtotal), 480, rowY, { align: 'right', width: 80 });
      rowY += 18;

      doc.text('Tax:', 400, rowY);
      doc.text(fmt(po.taxAmount), 480, rowY, { align: 'right', width: 80 });
      rowY += 18;

      doc.font('Helvetica-Bold');
      doc.text('TOTAL:', 400, rowY);
      doc.text(fmt(po.totalAmount), 480, rowY, { align: 'right', width: 80 });

      // ── Notes ──────────────────────────────────────────────
      if (po.notes) {
        rowY += 30;
        doc.font('Helvetica-Bold').fontSize(9).text('Notes:', 50, rowY);
        doc.font('Helvetica').text(po.notes, 50, rowY + 14, { width: 510 });
      }

      // ── Footer ─────────────────────────────────────────────
      doc.fontSize(8).fillColor('#9ca3af')
        .text('This is a system-generated purchase order from BetterSpend.', 50, 730, {
          align: 'center', width: 510,
        });

      doc.end();
    });
  }
}
