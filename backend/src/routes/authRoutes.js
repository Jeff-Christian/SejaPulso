import { Router } from 'express';
import { login, refreshToken, logout } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;