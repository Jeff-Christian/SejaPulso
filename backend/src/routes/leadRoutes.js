import { Router } from 'express';
import { listLeads } from '../controllers/leadController.js';

const router = Router();

router.get('/', listLeads);

export default router;