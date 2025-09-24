import { Request, Response } from 'express';

export function getStatus(req: Request, res: Response) {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
}


