import { Injectable } from '@nestjs/common';
import { json2csv } from 'json-2-csv';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import * as XLSX from 'xlsx';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class ExportService extends BaseLogger {
  constructor() {
    super();
  }

  generateCsv(data: object[]) {
    const string = json2csv(data, {
      emptyFieldValue: '-',
    });
    return Buffer.from(string, 'utf-8');
  }

  generateExcelFile(data: object[], sheetName: string): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generatePdf(data: object[], title: string): Promise<Buffer> {
    return new Promise((resolve) => {
      const fonts = { Roboto: { normal: 'Helvetica', bold: 'Helvetica-Bold' } };
      const printer = new PdfPrinter(fonts);

      const keys = Object.keys(data[0]); // Extract headers
      const tableBody = [
        keys.map((key) => ({ text: key.toUpperCase(), bold: true })),
      ];

      // Add rows
      data.forEach((item) => {
        tableBody.push(keys.map((key) => item[key] || '-'));
      });

      // PDF Content
      const docDefinition = {
        content: [
          { text: title, style: 'header' },
          { table: { body: tableBody }, layout: 'lightHorizontalLines' },
        ],
        styles: { header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] } },
      };

      const pdfDoc = printer.createPdfKitDocument(
        docDefinition as unknown as TDocumentDefinitions,
      );
      const buffers: Buffer[] = [];

      pdfDoc.on('data', (chunk) => buffers.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(buffers)));
      pdfDoc.end();
    });
  }
}
