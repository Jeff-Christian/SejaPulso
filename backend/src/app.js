import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Configuração do CORS para permitir requisições do Frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Registro das rotas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'SejaPulso API' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⚡ API SejaPulso rodando com sucesso na porta ${PORT}`);
});