import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultProfessionalSettings,
  estimateCampaignReach,
  formatCompactMetric,
  getCampaignObjectiveLabel,
  getProfessionalCategoryLabel,
  getProfessionalPlanLabel
} from "../src/utils/professional.ts";

test("cria configuração profissional gratuita e desativada por padrão", () => {
  const settings = createDefaultProfessionalSettings();
  assert.equal(settings.enabled, false);
  assert.equal(settings.plan, "free");
  assert.equal(settings.category, "talent");
});

test("estima alcance crescente conforme orçamento e duração", () => {
  const shortReach = estimateCampaignReach(20, 3, "reach");
  const longReach = estimateCampaignReach(100, 14, "reach");
  assert.ok(shortReach >= 250);
  assert.ok(longReach > shortReach);
});

test("aplica multiplicadores por objetivo de campanha", () => {
  const reach = estimateCampaignReach(50, 7, "reach");
  const visits = estimateCampaignReach(50, 7, "profile_visits");
  const messages = estimateCampaignReach(50, 7, "messages");
  assert.ok(reach > visits);
  assert.ok(visits > messages);
});

test("formata métricas e rótulos do domínio profissional", () => {
  assert.equal(formatCompactMetric(900), "900");
  assert.equal(formatCompactMetric(1400), "1.4 mil");
  assert.equal(getProfessionalCategoryLabel("brand"), "Marca");
  assert.equal(getProfessionalPlanLabel("business"), "Xolot Negócios");
  assert.equal(getCampaignObjectiveLabel("messages"), "Mais mensagens");
});
