import { inject, injectable } from 'tsyringe';
import { CreateProctorUseCase } from './CreateProctorUseCase.js';
import {
  IProctorRowParserToken,
  type IProctorRowParser,
} from '../../../ports/services/IProctorRowParser.js';
import { DomainError } from '../../../../domain/errors/DomainError.js';

export interface ImportProctorsInput {
  buffer: Buffer;
  mimeType: string;
}

export interface ImportProctorsOutput {
  created: number;
  skipped: number;
  errors: string[];
}

@injectable()
export class ImportProctorsUseCase {
  constructor(
    @inject(IProctorRowParserToken) private readonly parser: IProctorRowParser,
    @inject(CreateProctorUseCase) private readonly create: CreateProctorUseCase,
  ) {}

  public async execute(input: ImportProctorsInput): Promise<ImportProctorsOutput> {
    const rows = await this.parser.parse(input.buffer, input.mimeType);
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        await this.create.execute({
          nationalId: row.nationalId,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          email: row.email,
          proctorType: row.proctorType,
        });
        created += 1;
      } catch (err) {
        if (err instanceof DomainError && err.code === 'CONFLICT') {
          // Duplicate national_id — treat as already-imported, not an error.
          skipped += 1;
          continue;
        }
        const message = err instanceof Error ? err.message : 'unknown error';
        errors.push(`Row ${row.rowNumber}: ${message}`);
      }
    }

    return { created, skipped, errors };
  }
}
