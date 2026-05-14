import 'reflect-metadata';
import { container } from 'tsyringe';
import type { DataSource } from 'typeorm';
import { loadEnv } from '../config/env.js';
import { registerAuditServices } from './registrations/audit.js';
import { registerRepositories } from './registrations/repositories.js';
import { registerServices } from './registrations/services.js';

/**
 * Wires the application's dependency-injection container for a specific
 * datasource instance.
 */
export function registerDependencies(dataSource: DataSource): void {
  const env = loadEnv();

  registerServices(dataSource, env);
  registerRepositories(dataSource);
  registerAuditServices(dataSource);
}

export { container };
