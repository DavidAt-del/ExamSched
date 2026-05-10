import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import type { DataSourceOptions } from 'typeorm';

// Builds TypeORM extra options to route the underlying pg pool through the
// Cloud SQL Connector with IAM auth. No password leaves the env.
export async function buildCloudSqlOptions(opts: {
  instanceConnectionName: string;
  username: string;
  database: string;
}): Promise<Partial<DataSourceOptions>> {
  const connector = new Connector();
  const clientOpts = await connector.getOptions({
    instanceConnectionName: opts.instanceConnectionName,
    ipType: IpAddressTypes.PRIVATE,
    authType: AuthTypes.IAM,
  });
  return {
    type: 'postgres',
    username: opts.username,
    database: opts.database,
    extra: { ...clientOpts },
  };
}
