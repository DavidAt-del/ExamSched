export interface IUnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const IUnitOfWorkToken = Symbol.for('IUnitOfWork');
