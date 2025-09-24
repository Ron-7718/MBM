import { Router } from 'express';
import { getStatus } from '../controllers/healthController';

const router = Router();

router.get('/', getStatus);

export default router;


