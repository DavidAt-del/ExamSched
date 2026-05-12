import { Readable } from 'node:stream';
import ExcelJS from 'exceljs';
import { injectable } from 'tsyringe';
import { ProctorType } from '@app/shared';
import type {
  IProctorRowParser,
  ParsedProctorRow,
} from '../../application/ports/services/IProctorRowParser.js';
import { DomainError } from '../../domain/errors/DomainError.js';

const HEADER_ALIASES: Record<string, keyof RawRow> = {
  national_id: 'nationalId',
  nationalid: 'nationalId',
  'national id': 'nationalId',
  'תעודת זהות': 'nationalId',
  first_name: 'firstName',
  firstname: 'firstName',
  'שם פרטי': 'firstName',
  last_name: 'lastName',
  lastname: 'lastName',
  'שם משפחה': 'lastName',
  phone: 'phone',
  טלפון: 'phone',
  email: 'email',
  'דואל': 'email',
  proctor_type: 'proctorType',
  proctortype: 'proctorType',
  type: 'proctorType',
  'סוג': 'proctorType',
};

interface RawRow {
  nationalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  proctorType?: string;
}

@injectable()
export class ExcelProctorRowParser implements IProctorRowParser {
  public async parse(buffer: Buffer, mimeType: string): Promise<ParsedProctorRow[]> {
    const isCsv =
      mimeType === 'text/csv' ||
      mimeType === 'application/csv' ||
      mimeType === 'text/plain';
    const workbook = new ExcelJS.Workbook();
    if (isCsv) {
      // Strip a UTF-8 BOM (EF BB BF) if present so the first column header
      // doesn't get prefixed with the invisible BOM character.
      const csvBuffer =
        buffer.length >= 3 &&
        buffer[0] === 0xef &&
        buffer[1] === 0xbb &&
        buffer[2] === 0xbf
          ? buffer.subarray(3)
          : buffer;
      // exceljs's CSV typings predate Node 22's Stream interface (missing
      // `compose`); the runtime contract is unchanged so we widen via unknown.
      const stream = bufferToStream(csvBuffer) as unknown;
      await workbook.csv.read(stream as Parameters<typeof workbook.csv.read>[0]);
    } else {
      // Node 22's Buffer is Buffer<ArrayBufferLike>; copy into a plain
      // ArrayBuffer so it satisfies exceljs's narrower Buffer<ArrayBuffer>.
      const ab = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(ab).set(buffer);
      await workbook.xlsx.load(ab);
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new DomainError('INVARIANT_VIOLATED', 'Workbook has no sheets', 422);

    const headerRow = sheet.getRow(1);
    const columnByIndex = new Map<number, keyof RawRow>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = String(cell.value ?? '').trim().toLowerCase();
      const mapped = HEADER_ALIASES[key];
      if (mapped) columnByIndex.set(colNumber, mapped);
    });
    if (columnByIndex.size === 0) {
      throw new DomainError(
        'INVARIANT_VIOLATED',
        'Could not detect any known column header',
        422,
      );
    }

    const rows: ParsedProctorRow[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const raw: RawRow = {};
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const field = columnByIndex.get(colNumber);
        if (!field) return;
        const value = cellValueToString(cell.value);
        if (value !== null) (raw as Record<string, unknown>)[field] = value;
      });
      const parsed = projectRow(raw, rowNumber);
      if (parsed) rows.push(parsed);
    });
    return rows;
  }
}

function projectRow(raw: RawRow, rowNumber: number): ParsedProctorRow | null {
  if (!raw.nationalId || !raw.firstName || !raw.lastName) return null;
  const proctorType = normalizeProctorType(raw.proctorType);
  if (!proctorType) {
    throw new DomainError(
      'INVARIANT_VIOLATED',
      `Row ${rowNumber}: unknown proctor type "${raw.proctorType ?? ''}"`,
      422,
    );
  }
  // Numeric Excel cells drop leading zeros: '012345678' becomes 12345678.
  // Strip non-digits, then left-pad to 9 so the stored ID matches the
  // original (`NationalId.create` continues to reject genuinely malformed
  // values).
  const digits = raw.nationalId.trim().replace(/\D/g, '');
  const nationalId = digits.length > 0 && digits.length <= 9 ? digits.padStart(9, '0') : digits;
  return {
    rowNumber,
    nationalId,
    firstName: raw.firstName.trim(),
    lastName: raw.lastName.trim(),
    phone: raw.phone ? raw.phone.trim() : null,
    email: raw.email ? raw.email.trim() : null,
    proctorType,
  };
}

function normalizeProctorType(value: string | undefined): ProctorType | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === ProctorType.Opener || v === 'פותח' || v === 'פותח כיתה') {
    return ProctorType.Opener;
  }
  if (v === ProctorType.Regular || v === 'משגיח' || v === 'רגיל') {
    return ProctorType.Regular;
  }
  return null;
}

function cellValueToString(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text;
  }
  if (typeof value === 'object' && 'result' in value) {
    const r = (value as { result?: unknown }).result;
    return r === null || r === undefined ? null : String(r);
  }
  return null;
}

function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {
  return Readable.from(buffer);
}
