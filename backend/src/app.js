import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import commissionRoutes from './routes/commissionRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/commissions', commissionRoutes);

// Rota de Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'SejaPulso API', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⚡ API SejaPulso rodando com sucesso na porta ${PORT}`);
});