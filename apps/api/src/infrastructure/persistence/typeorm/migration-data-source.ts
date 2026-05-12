/**
 * Dedicated entry-point for the TypeORM CLI (migration:run / migration:generate).
 * Exports exactly one DataSource instance as the default export so the CLI does
 * not complain about multiple DataSource exports from data-source.ts.
 */
import { buildDataSourceOptions } from './data-source.js';
import { DataSource } from 'typeorm';

export default new DataSource(buildDataSourceOptions());

