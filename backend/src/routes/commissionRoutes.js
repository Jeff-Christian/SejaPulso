import { Router } from 'express';
import { listCommissions } from '../controllers/commissionController.js';

const router = Router();

router.get('/', listCommissions);

export default router;