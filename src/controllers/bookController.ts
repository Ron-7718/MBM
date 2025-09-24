import { Request, Response } from 'express';

export async function listBooks(req: Request, res: Response) {
  return res.json({ books: [] });
}


