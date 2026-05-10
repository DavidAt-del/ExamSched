export interface IClock {
  now(): Date;
}

export const IClockToken = Symbol.for('IClock');
