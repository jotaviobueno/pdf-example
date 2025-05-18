import { Module } from '@nestjs/common';
import { ReceiptService } from './pdf.service';
import { ReceiptController } from './pdf.controller';

@Module({
  controllers: [ReceiptController],
  providers: [ReceiptService],
})
export class PdfModule {}
