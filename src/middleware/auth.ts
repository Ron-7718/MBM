import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET || '';
    if (!secret) return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET missing' });
    const payload = jwt.verify(token, secret);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Requires a valid JWT whose payload carries role: "admin".
 * Used to protect category/subcategory management endpoints.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET || '';
    if (!secret) return res.status(500).json({ success: false, message: 'Server misconfigured: JWT_SECRET missing' });
    const payload = jwt.verify(token, secret) as { role?: string };
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
    }
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

