import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import * as PDFDocument from 'pdfkit';

interface Charge {
  id: string;
  description: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface ReceiptData {
  receiptNumber: string;
  date: Date;
  customerName: string;
  customerDocument: string;
  charges: Charge[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceFee: number;
  totalPaid: number;
  paymentMethod: string;
  paymentDate: Date;
  transactionId?: string;
}

@Injectable()
export class ReceiptService {
  private readonly CHARGE_ITEM_HEIGHT = 35;
  private readonly PAGE_MARGIN_BOTTOM = 50;
  private readonly PAGE_BREAK_THRESHOLD = 100;

  async generateFlowReceipt(): Promise<Buffer> {
    const receiptData: ReceiptData = {
      receiptNumber: 'FF-2025-12345',
      date: new Date(),
      customerName: 'Maria Silva',
      customerDocument: '123.456.789-00',
      charges: [
        {
          id: 'CH001',
          description: 'ERS122-Km108-Sul',
          dueDate: '10/05/2025',
          amount: 13.9,
          status: 'Pago',
        },
        {
          id: 'CH002',
          description: 'ERS122-Km108-Norte',
          dueDate: '10/05/2025',
          amount: 49.9,
          status: 'Pago',
        },
      ],
      subtotal: 154.8,
      discount: 0,
      tax: 0,
      serviceFee: 0,
      totalPaid: 154.8,
      paymentMethod: 'Cartão de Crédito',
      paymentDate: new Date(),
      transactionId: 'TRX-789456123',
    };

    return new Promise((resolve) => {
      const buffers: Buffer[] = [];

      const doc = new PDFDocument({
        size: [400, 700],
        margin: 30,
        info: {
          Title: 'Comprovante de Pagamento FreeFlow',
          Author: 'CSG FreeFlow',
          CreationDate: new Date(),
        },

        bufferPages: true,
      });

      doc.on('data', (chunk) => buffers.push(chunk));

      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      this.addMinimalHeader(doc);
      this.addReceiptDetails(doc, receiptData);
      this.addChargesTablePaged(doc, receiptData.charges);
      this.addTotalsSection(doc, receiptData);
      this.addPaymentInfo(doc, receiptData);

      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        this.addMinimalFooter(doc, i + 1, totalPages);
      }

      doc.end();
    });
  }

  private addMinimalHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(12)
      .fillColor('#555')
      .text('COMPROVANTE DE PAGAMENTO', { align: 'center' });

    doc.moveDown(1);
  }

  private addReceiptDetails(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    doc
      .strokeColor('#eaeaea')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(0.5);

    doc
      .fillColor('#555')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('INFORMAÇÕES DO RECIBO', 30, doc.y);

    doc.moveDown(0.8);

    const labelX = 30;
    const valueX = 115;

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#555')
      .text('RECIBO Nº:', labelX, doc.y);

    doc.font('Helvetica').text(data.receiptNumber, valueX, doc.y - 9);

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').text('DATA:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(format(data.date, "dd/MM/yyyy 'às' HH:mm:ss"), valueX, doc.y - 9);

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').text('CLIENTE:', labelX, doc.y);

    doc.font('Helvetica').text(data.customerName, valueX, doc.y - 9);

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').text('DOCUMENTO:', labelX, doc.y);

    doc.font('Helvetica').text(data.customerDocument, valueX, doc.y - 9);

    doc.moveDown(0.5);
  }

  private addChargesTablePaged(
    doc: PDFKit.PDFDocument,
    charges: Charge[],
  ): void {
    doc.moveDown(1);
    this.addSectionHeader(doc, 'COBRANÇAS');
    doc.moveDown(0.8);

    let itemsOnCurrentPage = 0;

    for (let index = 0; index < charges.length; index++) {
      const charge = charges[index];

      const spaceAvailable = doc.page.height - doc.y - this.PAGE_MARGIN_BOTTOM;

      if (spaceAvailable < this.PAGE_BREAK_THRESHOLD) {
        doc.addPage();

        if (index < charges.length) {
          this.addSectionHeader(doc, 'COBRANÇAS (continuação)');
          doc.moveDown(0.8);
          itemsOnCurrentPage = 0;
        }
      }

      if (itemsOnCurrentPage % 2 === 0) {
        doc.rect(30, doc.y, doc.page.width - 60, 30).fill('#f9f9f9');
      }

      const yPos = doc.y;

      doc
        .fillColor('#555')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(charge.id, 35, yPos + 5);

      doc
        .font('Helvetica')
        .text(charge.description, 35, yPos + 15, { width: 200 });

      doc
        .font('Helvetica')
        .fontSize(8)
        .text(`Venc: ${charge.dueDate}`, doc.page.width - 145, yPos + 5);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(
          `R$ ${charge.amount.toFixed(2).replace('.', ',')}`,
          doc.page.width - 145,
          yPos + 15,
        );

      doc.y = yPos + this.CHARGE_ITEM_HEIGHT;
      itemsOnCurrentPage++;
    }

    doc.moveDown(0.5);
  }

  private addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .strokeColor('#eaeaea')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(0.5);

    doc
      .fillColor('#555')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(title, 30, doc.y);
  }

  private addTotalsSection(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    const spaceNeeded = 200;
    const spaceAvailable = doc.page.height - doc.y - this.PAGE_MARGIN_BOTTOM;

    if (spaceAvailable < spaceNeeded) {
      doc.addPage();
    }

    doc.moveDown(1);
    this.addSectionHeader(doc, 'RESUMO DE VALORES');
    doc.moveDown(0.8);

    const labelX = 30;
    const valueX = 200;

    doc.font('Helvetica-Bold').fontSize(9).text('SUBTOTAL:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(
        `R$ ${data.subtotal.toFixed(2).replace('.', ',')}`,
        valueX,
        doc.y - 9,
        { align: 'right' },
      );

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').text('DESCONTO:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(
        `R$ ${data.discount.toFixed(2).replace('.', ',')}`,
        valueX,
        doc.y - 9,
        { align: 'right' },
      );

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').text('TAXA DE SERVIÇO:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(
        `R$ ${data.serviceFee.toFixed(2).replace('.', ',')}`,
        valueX,
        doc.y - 9,
        { align: 'right' },
      );

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').text('IMPOSTO:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(`R$ ${data.tax.toFixed(2).replace('.', ',')}`, valueX, doc.y - 9, {
        align: 'right',
      });

    doc.moveDown(0.7);

    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').fontSize(11).text('TOTAL PAGO:', labelX, doc.y);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(
        `R$ ${data.totalPaid.toFixed(2).replace('.', ',')}`,
        valueX,
        doc.y - 11,
        { align: 'right' },
      );

    doc.moveDown(0.5);
  }

  private addPaymentInfo(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    const spaceNeeded = 150;
    const spaceAvailable = doc.page.height - doc.y - this.PAGE_MARGIN_BOTTOM;

    if (spaceAvailable < spaceNeeded) {
      doc.addPage();
    }

    doc.moveDown(1);
    this.addSectionHeader(doc, 'DETALHES DO PAGAMENTO');
    doc.moveDown(0.8);

    const labelX = 30;
    const valueX = 120;

    doc.font('Helvetica-Bold').fontSize(8).text('MÉTODO:', labelX, doc.y);

    doc.font('Helvetica').text(data.paymentMethod, valueX, doc.y - 8);

    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').text('DATA:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(
        format(data.paymentDate, "dd/MM/yyyy 'às' HH:mm:ss"),
        valueX,
        doc.y - 8,
      );

    doc.moveDown(0.7);

    if (data.transactionId) {
      doc.font('Helvetica-Bold').text('ID TRANSAÇÃO:', labelX, doc.y);

      doc.font('Helvetica').text(data.transactionId, valueX, doc.y - 8);

      doc.moveDown(0.7);
    }

    doc.moveDown(0.5);
  }

  private addMinimalFooter(
    doc: PDFKit.PDFDocument,
    pageNumber: number,
    totalPages: number,
  ): void {
    const currentY = doc.y;

    const footerY = doc.page.height - 100;
    doc.y = footerY;

    doc
      .strokeColor('#eaeaea')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(1);

    const centerX = doc.page.width / 2;

    doc.fontSize(7).font('Helvetica').fillColor('#888');

    const text1 = 'Este documento é autêntico e foi gerado eletronicamente.';
    doc.text(text1, centerX - doc.widthOfString(text1) / 2, doc.y);

    doc.moveDown(0.5);

    doc.moveDown(0.5);

    const dateTime = new Date().toLocaleString('pt-BR');
    let text3 = `Emitido em ${dateTime}`;

    if (totalPages > 1) {
      text3 += ` | Página ${pageNumber} de ${totalPages}`;
    }

    doc.fontSize(6);
    doc.text(text3, centerX - doc.widthOfString(text3) / 2, doc.y);

    doc.y = currentY;
  }
}
