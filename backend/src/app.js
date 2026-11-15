import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";

// Importação das rotas de webhook e do serviço de jobs de pagamento
import webhookRoutes from "./routes/webhookRoutes.js";
import { startPaymentJobs } from "./services/paymentJobs.js";
// Se já tiver o job de expiração de reservas criado, descomente a linha abaixo:
// import { startReservationExpiryJob } from './services/reservationExpiryJob.js';

dotenv.config();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
});

const app = express();

// Configuração do CORS para permitir requisições do Frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Limitador de taxa na rota de login (movido para antes de authRoutes para garantir que seja aplicado)
app.use("/api/auth/login", loginLimiter);

// Registro das rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/webhooks", webhookRoutes); // Sem JWT; protegido pelo token do Asaas

app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "SejaPulso API" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⚡ API SejaPulso rodando com sucesso na porta ${PORT}`);
  startPaymentJobs();
  // startReservationExpiryJob(); // Descomente se já existir no projeto
});
