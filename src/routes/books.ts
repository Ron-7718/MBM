import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ books: [] });
});

export default router;


