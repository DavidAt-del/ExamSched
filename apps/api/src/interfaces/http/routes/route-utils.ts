/**
 * Adapts an async Express handler so rejected promises are forwarded to the
 * standard error middleware.
 */
export function wrap<Req, Res>(
  fn: (req: Req, res: Res) => Promise<void>,
): (req: Req, res: Res, next: (err?: unknown) => void) => void {
  return (req: Req, res: Res, next: (err?: unknown) => void): void => {
    fn(req, res).catch(next);
  };
}

