import { Router } from 'express';

const router = Router();

router.post('/login', (req, res) => {
  res.json({ message: 'login not implemented yet' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'register not implemented yet' });
});

export default router;


