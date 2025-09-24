import { Request, Response } from 'express';

export async function listUsers(req: Request, res: Response) {
  return res.json({ users: [] });
}


