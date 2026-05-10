import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.header(REQUEST_ID_HEADER);
    const id = incoming && incoming.length > 0 ? incoming : randomUUID();
    res.locals.requestId = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  };
}
