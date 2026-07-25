import type {
  CampaignObjective,
  ProfessionalCategory,
  ProfessionalPlanId,
  ProfessionalSettings
} from "../types";

export const PROFESSIONAL_PLAN_OPTIONS: Array<{
  description: string;
  features: string[];
  id: ProfessionalPlanId;
  label: string;
  priceLabel: string;
}> = [
  {
    description: "Para criar presença, publicar e acompanhar o básico.",
    features: ["Perfil profissional", "Métricas essenciais", "Contato por mensagem"],
    id: "free",
    label: "Grátis",
    priceLabel: "R$ 0"
  },
  {
    description: "Para criadores e talentos que querem crescer com consistência.",
    features: ["Métricas detalhadas", "Links no perfil", "Campanhas promocionais"],
    id: "pro",
    label: "Xolot Pro",
    priceLabel: "R$ 19,90/mês"
  },
  {
    description: "Para marcas, projetos e negócios que anunciam em equipe.",
    features: ["Painel de campanhas", "Relatórios", "Prioridade no suporte"],
    id: "business",
    label: "Xolot Negócios",
    priceLabel: "R$ 99/mês"
  }
];

export const PROFESSIONAL_CATEGORY_OPTIONS: Array<{
  id: ProfessionalCategory;
  label: string;
}> = [
  { id: "talent", label: "Talento" },
  { id: "creator", label: "Criador" },
  { id: "business", label: "Negócio" },
  { id: "brand", label: "Marca" },
  { id: "project", label: "Projeto" },
  { id: "service", label: "Serviço" }
];

export const CAMPAIGN_OBJECTIVE_OPTIONS: Array<{
  description: string;
  id: CampaignObjective;
  label: string;
}> = [
  {
    description: "Mostrar a publicação para mais pessoas.",
    id: "reach",
    label: "Mais alcance"
  },
  {
    description: "Levar pessoas interessadas ao seu perfil.",
    id: "profile_visits",
    label: "Visitas ao perfil"
  },
  {
    description: "Estimular conversas e pedidos de contato.",
    id: "messages",
    label: "Mais mensagens"
  }
];

export function createDefaultProfessionalSettings(): ProfessionalSettings {
  return {
    category: "talent",
    enabled: false,
    externalLink: "",
    plan: "free",
    updatedAt: new Date().toISOString()
  };
}

export function getProfessionalCategoryLabel(category: ProfessionalCategory) {
  return (
    PROFESSIONAL_CATEGORY_OPTIONS.find((option) => option.id === category)
      ?.label ?? "Profissional"
  );
}

export function getProfessionalPlanLabel(plan: ProfessionalPlanId) {
  return (
    PROFESSIONAL_PLAN_OPTIONS.find((option) => option.id === plan)?.label ??
    "Grátis"
  );
}

export function getCampaignObjectiveLabel(objective: CampaignObjective) {
  return (
    CAMPAIGN_OBJECTIVE_OPTIONS.find((option) => option.id === objective)?.label ??
    "Mais alcance"
  );
}

export function estimateCampaignReach(
  budget: number,
  durationDays: number,
  objective: CampaignObjective
) {
  const objectiveMultiplier =
    objective === "reach" ? 1 : objective === "profile_visits" ? 0.78 : 0.62;

  return Math.max(
    250,
    Math.round((budget * 68 + durationDays * 110) * objectiveMultiplier)
  );
}

export function formatCompactMetric(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)} mi`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} mil`;
  }

  return String(Math.round(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency"
  }).format(value);
}
