import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { ExcelProctorRowParser } from '../../../src/infrastructure/excel/ExcelProctorRowParser.js';

async function buildXlsx(rows: Array<Array<string | number>>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Proctors');
  for (const row of rows) sheet.addRow(row);
  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab as ArrayBuffer);
}

describe('ExcelProctorRowParser', () => {
  const parser = new ExcelProctorRowParser();

  it('preserves leading zeros on national IDs entered as numeric cells', async () => {
    const buf = await buildXlsx([
      ['national_id', 'first_name', 'last_name', 'proctor_type'],
      [12345678, 'Dana', 'Cohen', 'opener'],
      [123456789, 'Oren', 'Levi', 'regular'],
    ]);
    const rows = await parser.parse(
      buf,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.nationalId).toBe('012345678');
    expect(rows[1]?.nationalId).toBe('123456789');
  });

  it('strips a UTF-8 BOM from CSV input so the first header parses', async () => {
    const csv =
      'national_id,first_name,last_name,proctor_type\n123456789,Dana,Cohen,opener\n';
    const buf = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from(csv, 'utf8'),
    ]);
    const rows = await parser.parse(buf, 'text/csv');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.nationalId).toBe('123456789');
    expect(rows[0]?.firstName).toBe('Dana');
  });
});
