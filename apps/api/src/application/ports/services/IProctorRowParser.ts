import type { ProctorType } from '@app/shared';

export interface ParsedProctorRow {
  rowNumber: number;
  nationalId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  proctorType: ProctorType;
}

export interface IProctorRowParser {
  /**
   * Parse a CSV or XLSX file buffer into rows. The implementation MUST not
   * read the filesystem; the buffer carries the entire payload.
   */
  parse(buffer: Buffer, mimeType: string): Promise<ParsedProctorRow[]>;
}

export const IProctorRowParserToken = Symbol.for('IProctorRowParser');
