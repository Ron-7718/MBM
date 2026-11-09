import { Router, type Request, type Response, type NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { listUsers, getMyProfile, getUserById, updateMyProfile } from '../controllers/userController';
import { listAuthorsRules, updateMyProfileRules, validateUserId } from '../validators/userValidator';
import { handleValidation } from '../validators/bookValidator';
import { requireAuth } from '../middleware/auth';
import { handleMulterError, profilePhotoUploadField } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';
import { cleanupUploadedFile } from '../utils/helpers';
import ApiError from '../utils/ApiError';

const router = Router();

const parseSocialLinksFormValue = (req: Request, _res: Response, next: NextFunction): void => {
  if (typeof req.body?.socialLinks === 'string') {
    try {
      req.body.socialLinks = JSON.parse(req.body.socialLinks);
    } catch {
      // Leave malformed input for express-validator to reject below.
    }
  }
  next();
};

const validateProfileUpdate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    await cleanupUploadedFile(req.file);
    next(ApiError.validationFailed(errors.array().map((error) => error.msg as string)));
    return;
  }
  next();
};

/* ══════════════════════════════════════════
   GET /api/users — public creator directory
   (authors/writers only, readers excluded)
   ══════════════════════════════════════════ */
router.get('/creators', ...listAuthorsRules, handleValidation, listUsers);

router.get('/me', requireAuth, getMyProfile);
router.patch(
  '/me',
  requireAuth,
  uploadLimiter,
  profilePhotoUploadField,
  handleMulterError,
  parseSocialLinksFormValue,
  ...updateMyProfileRules,
  validateProfileUpdate,
  updateMyProfile,
);

/* ══════════════════════════════════════════
   GET /api/users/:id — public author/writer profile
   ══════════════════════════════════════════ */
router.get('/:id', ...validateUserId, handleValidation, getUserById);

export default router;


