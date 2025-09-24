import { Request, Response, NextFunction } from 'express';

export function validateBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }
    next();
  };
}


