// receipt.controller.ts
import { Controller, Get, Post, Body, Res } from '@nestjs/common';
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
        'Content-Disposition': 'inline; filename="flow-receipt.pdf"',
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      res.status(500).send('Erro ao gerar o recibo: ' + error.message);
    }
  }

  @Post('flow')
  async generateCustomFlowReceipt(@Body() data: any, @Res() res: Response) {
    try {
      const buffer = await this.receiptService.generateFlowReceipt(data);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="flow-receipt.pdf"',
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      res.status(500).send('Erro ao gerar o recibo: ' + error.message);
    }
  }
}
