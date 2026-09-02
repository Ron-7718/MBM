import { Router } from 'express';
import { listUsers, getUserById } from '../controllers/userController';
import { listAuthorsRules, validateUserId } from '../validators/userValidator';
import { handleValidation } from '../validators/bookValidator';

const router = Router();

/* ══════════════════════════════════════════
   GET /api/users — public creator directory
   (authors/writers only, readers excluded)
   ══════════════════════════════════════════ */
router.get('/creators', ...listAuthorsRules, handleValidation, listUsers);

/* ══════════════════════════════════════════
   GET /api/users/:id — public author/writer profile
   ══════════════════════════════════════════ */
router.get('/:id', ...validateUserId, handleValidation, getUserById);

export default router;


