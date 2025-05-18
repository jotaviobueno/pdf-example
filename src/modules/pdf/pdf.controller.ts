import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReceiptService } from './pdf.service';

@Controller('receipt')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get('flow')
  async generateFlowReceipt(@Res() res: Response) {
    try {
      const buffer = await this.receiptService.generateFlowReceipt();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'inline; filename="comprovante-de-pagamento.pdf"',
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      res.status(500).send('Erro ao gerar o recibo: ' + error.message);
    }
  }
}
