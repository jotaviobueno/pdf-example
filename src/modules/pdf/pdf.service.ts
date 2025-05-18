// receipt.service.ts
import { Injectable } from '@nestjs/common';
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
  date: string;
  customerName: string;
  customerDocument: string;
  charges: Charge[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceFee: number;
  totalPaid: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId?: string;
}

@Injectable()
export class ReceiptService {
  async generateFlowReceipt(data?: Partial<ReceiptData>): Promise<Buffer> {
    // Dados padrão para demonstração
    const receiptData: ReceiptData = {
      receiptNumber: data?.receiptNumber || 'FF-2025-12345',
      date: data?.date || new Date().toLocaleDateString('pt-BR'),
      customerName: data?.customerName || 'Maria Silva',
      customerDocument: data?.customerDocument || '123.456.789-00',
      charges: data?.charges || [
        {
          id: 'CH001',
          description: 'Assinatura Mensal - Maio/2025',
          dueDate: '10/05/2025',
          amount: 99.9,
          status: 'Pago',
        },
        {
          id: 'CH002',
          description: 'Serviços Adicionais',
          dueDate: '10/05/2025',
          amount: 49.9,
          status: 'Pago',
        },
        {
          id: 'CH003',
          description: 'Taxa de Processamento',
          dueDate: '10/05/2025',
          amount: 5.0,
          status: 'Pago',
        },
      ],
      subtotal: data?.subtotal || 154.8,
      discount: data?.discount || 0,
      tax: data?.tax || 0,
      serviceFee: data?.serviceFee || 0,
      totalPaid: data?.totalPaid || 154.8,
      paymentMethod: data?.paymentMethod || 'Cartão de Crédito',
      paymentDate: data?.paymentDate || new Date().toLocaleDateString('pt-BR'),
      transactionId: data?.transactionId || 'TRX-789456123',
    };

    return new Promise((resolve) => {
      const buffers: Buffer[] = [];

      // Design minimalista - usar tamanho menor que A4
      const doc = new PDFDocument({
        size: [400, 700], // Tamanho um pouco maior para acomodar campos adicionais
        margin: 30,
        info: {
          Title: 'Comprovante de Pagamento FreeFlow',
          Author: 'Sua Empresa',
        },
      });

      doc.on('data', (chunk) => buffers.push(chunk));

      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Layout minimalista com cabeçalhos de seção
      this.addMinimalHeader(doc);
      this.addReceiptDetails(doc, receiptData);
      this.addChargesTable(doc, receiptData.charges);
      this.addTotalsSection(doc, receiptData);
      this.addPaymentInfo(doc, receiptData);
      this.addMinimalFooter(doc);

      doc.end();
    });
  }

  private addMinimalHeader(doc: PDFKit.PDFDocument): void {
    // Título minimalista
    doc
      .fontSize(12)
      .fillColor('#555')
      .text('COMPROVANTE DE PAGAMENTO', { align: 'center' });

    doc.moveDown(1);
  }

  private addReceiptDetails(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    // Adicionando cabeçalho de seção - CORRIGIDO
    doc
      .strokeColor('#eaeaea')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(0.3); // Pequeno espaço antes do título

    doc
      .fillColor('#555')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('INFORMAÇÕES DO RECIBO', {
        align: 'left', // Alterado para left
        width: doc.page.width - 60,
      });

    doc.moveDown(0.5); // Espaço menor após o título

    // Colunas alinhadas com larguras fixas para evitar sobreposição
    const labelX = 30; // Posição X inicial para etiquetas
    const valueX = 115; // Posição X inicial para valores

    // RECIBO Nº
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#555')
      .text('RECIBO Nº:', labelX, doc.y);

    doc.font('Helvetica').text(data.receiptNumber, valueX, doc.y - 9);

    // Avançar para próxima linha
    doc.moveDown(0.5);

    // DATA
    doc.font('Helvetica-Bold').text('DATA:', labelX, doc.y);

    doc.font('Helvetica').text(data.date, valueX, doc.y - 9);

    doc.moveDown(0.5);

    // CLIENTE
    doc.font('Helvetica-Bold').text('CLIENTE:', labelX, doc.y);

    doc.font('Helvetica').text(data.customerName, valueX, doc.y - 9);

    doc.moveDown(0.5);

    // DOCUMENTO
    doc.font('Helvetica-Bold').text('DOCUMENTO:', labelX, doc.y);

    doc.font('Helvetica').text(data.customerDocument, valueX, doc.y - 9);

    doc.moveDown(1);
  }

  private addChargesTable(doc: PDFKit.PDFDocument, charges: Charge[]): void {
    doc
      .strokeColor('#eaeaea')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(0.3);

    // ALTERAÇÃO PRINCIPAL - Posicionando "COBRANÇAS" no início da linha
    doc
      .fillColor('#555')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('COBRANÇAS', 30, doc.y); // Forçando posição X=30 (início da linha)

    doc.moveDown(0.5);

    // Versão minimalista da tabela sem bordas
    charges.forEach((charge, index) => {
      // Alternar cores de fundo para facilitar leitura
      if (index % 2 === 0) {
        doc
          .rect(30, doc.y, doc.page.width - 60, 30) // Altura aumentada para evitar sobreposições
          .fill('#f9f9f9');
      }

      const yPos = doc.y;

      // ID e descrição à esquerda
      doc
        .fillColor('#555')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(charge.id, 35, yPos + 5);

      doc
        .font('Helvetica')
        .text(charge.description, 35, yPos + 15, { width: 200 });

      // Vencimento e valor à direita
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(`Venc: ${charge.dueDate}`, doc.page.width - 145, yPos + 5);

      doc
        .font('Helvetica-Bold')
        .text(
          `R$ ${charge.amount.toFixed(2).replace('.', ',')}`,
          doc.page.width - 60,
          yPos + 15,
          { align: 'right' },
        );

      // Avançar o cursor para garantir que o próximo item não sobreponha
      doc.y = yPos + 35;
    });

    doc.moveDown(0.5);
  }

  private addTotalsSection(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    // Adicionando cabeçalho de seção - CORRIGIDO
    doc
      .strokeColor('#eaeaea')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(0.3);

    // ALTERAÇÃO PRINCIPAL - Posicionando "RESUMO DE VALORES" no início da linha
    doc
      .fillColor('#555')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('RESUMO DE VALORES', 30, doc.y); // Forçando posição X=30 (início da linha)

    doc.moveDown(0.5);

    const labelX = 30; // X para rótulos
    const valueX = 200; // X para valores

    // Subtotal
    doc.font('Helvetica-Bold').fontSize(9).text('SUBTOTAL:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(
        `R$ ${data.subtotal.toFixed(2).replace('.', ',')}`,
        valueX,
        doc.y - 9,
        { align: 'right' },
      );

    doc.moveDown(0.5);

    // Desconto
    doc.font('Helvetica-Bold').text('DESCONTO:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(
        `R$ ${data.discount.toFixed(2).replace('.', ',')}`,
        valueX,
        doc.y - 9,
        { align: 'right' },
      );

    doc.moveDown(0.5);

    // Taxa de serviço
    doc.font('Helvetica-Bold').text('TAXA DE SERVIÇO:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(
        `R$ ${data.serviceFee.toFixed(2).replace('.', ',')}`,
        valueX,
        doc.y - 9,
        { align: 'right' },
      );

    doc.moveDown(0.5);

    // Imposto
    doc.font('Helvetica-Bold').text('IMPOSTO:', labelX, doc.y);

    doc
      .font('Helvetica')
      .text(`R$ ${data.tax.toFixed(2).replace('.', ',')}`, valueX, doc.y - 9, {
        align: 'right',
      });

    doc.moveDown(0.5);
  }

  private addPaymentInfo(doc: PDFKit.PDFDocument, data: ReceiptData): void {
    // Adicionando cabeçalho de seção - CORRIGIDO
    doc
      .strokeColor('#eaeaea')
      .lineWidth(0.5)
      .moveTo(30, doc.y)
      .lineTo(doc.page.width - 30, doc.y)
      .stroke();

    doc.moveDown(0.3);

    // ALTERAÇÃO PRINCIPAL - Posicionando "DETALHES DO PAGAMENTO" no início da linha
    doc
      .fillColor('#555')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('DETALHES DO PAGAMENTO', 30, doc.y); // Forçando posição X=30 (início da linha)

    doc.moveDown(0.5);

    // Nomes de campos e valores em colunas organizadas
    const labelX = 30; // X para etiquetas
    const valueX = 120; // X para valores

    // MÉTODO
    doc.font('Helvetica-Bold').fontSize(8).text('MÉTODO:', labelX, doc.y);

    doc.font('Helvetica').text(data.paymentMethod, valueX, doc.y - 8);

    doc.moveDown(0.5);

    // DATA
    doc.font('Helvetica-Bold').text('DATA:', labelX, doc.y);

    doc.font('Helvetica').text(data.paymentDate, valueX, doc.y - 8);

    doc.moveDown(0.5);

    // ID TRANSAÇÃO (se existir)
    if (data.transactionId) {
      doc.font('Helvetica-Bold').text('ID TRANSAÇÃO:', labelX, doc.y);

      doc.font('Helvetica').text(data.transactionId, valueX, doc.y - 8);

      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);
  }

  private addMinimalFooter(doc: PDFKit.PDFDocument): void {
    // Informações de autenticação
    doc.moveDown(0.5);
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#888')
      .text('Este documento é autêntico e foi gerado eletronicamente.', {
        align: 'center',
      });

    doc.fontSize(7).text(`Código de autenticação: ${this.generateAuthCode()}`, {
      align: 'center',
    });

    doc.moveDown(0.5);
    doc.fontSize(6).text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, {
      align: 'center',
    });
  }

  private generateAuthCode(): string {
    // Gerar código de autenticação aleatório
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }
}
