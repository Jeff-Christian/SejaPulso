import {
  releaseHeldCommissions,
  syncAffiliateTiers,
} from "./commissionService.js";
import { reprocessPendingWebhooks } from "./asaasWebhookService.js";

let timer = null;

// Chame uma vez no app.js. Roda 20s após subir e depois a cada 10 minutos.
// Tudo aqui é idempotente: rodar mais vezes não causa efeito duplicado.
export const startPaymentJobs = ({ everyMs = 10 * 60 * 1000 } = {}) => {
  if (timer) return;

  const jobs = [
    ["webhooks pendentes", reprocessPendingWebhooks],
    ["fim do prazo de desistência", releaseHeldCommissions],
    ["tier mensal dos consultores", syncAffiliateTiers],
  ];

  const run = async () => {
    for (const [name, job] of jobs) {
      try {
        await job();
      } catch (err) {
        console.error(`❌ [Jobs de pagamento] ${name}:`, err);
      }
    }
  };

  setTimeout(run, 20 * 1000).unref?.();
  timer = setInterval(run, everyMs);
  timer.unref?.();
};
