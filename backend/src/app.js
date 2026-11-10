import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import leadRoutes from './routes/leadRoutes.js';

import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
});


dotenv.config();

const app = express();

// Configuração do CORS para permitir requisições do Frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Registro das rotas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Registro da rota no Express
app.use('/api/leads', leadRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'SejaPulso API' });
});

// Aplicando o limitador de taxa apenas na rota de login
app.use("/api/auth/login", loginLimiter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⚡ API SejaPulso rodando com sucesso na porta ${PORT}`);
});