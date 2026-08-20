import React, { useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CircleX,
  Link2,
  LockKeyhole,
  Megaphone,
  RefreshCw,
  Sparkles
} from "lucide-react-native";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { BackButton } from "../components/Navigation";
import { professionalStyles as s } from "../styles/professionalStyles";
import { colors } from "../theme";
import type {
  Player,
  ProfessionalSettings,
  ProfessionalSubscription,
  PromotionCampaign
} from "../types";
import {
  PROFESSIONAL_CATEGORY_OPTIONS,
  PROFESSIONAL_PLAN_OPTIONS,
  formatCompactMetric,
  getProfessionalCategoryLabel,
  getProfessionalSubscriptionDetail,
  getProfessionalSubscriptionStatusLabel,
  isProfessionalSubscriptionActive
} from "../utils/professional";

export function ProfessionalDashboardScreen({
  metrics,
  onBack,
  onCancelSubscription,
  onStartSubscription,
  onSyncSubscription,
  onUpdateSettings,
  settings,
  subscription,
  subscriptionLoading
}: {
  campaigns: PromotionCampaign[];
  metrics: {
    likes: number;
    messages: number;
    posts: number;
    views: number;
  };
  onBack: () => void;
  onCancelSubscription: () => Promise<void>;
  onPromotePost: (player: Player) => void;
  onStartSubscription: () => Promise<void>;
  onSyncSubscription: () => Promise<void>;
  onToggleCampaign: (campaignId: string) => void;
  onUpdateSettings: (settings: ProfessionalSettings) => void;
  posts: Player[];
  settings: ProfessionalSettings;
  subscription: ProfessionalSubscription | null;
  subscriptionLoading: boolean;
}) {
  const [externalLink, setExternalLink] = useState(settings.externalLink);
  const [isCheckoutConfirmationVisible, setIsCheckoutConfirmationVisible] =
    useState(false);
  const [isCancelConfirmationVisible, setIsCancelConfirmationVisible] =
    useState(false);
  const [subscriptionAction, setSubscriptionAction] = useState<
    "cancel" | "checkout" | "sync" | null
  >(null);
  const isPro = isProfessionalSubscriptionActive(subscription);
  const currentPlan = isPro ? "pro" : "free";

  function updateSettings(update: Partial<ProfessionalSettings>) {
    onUpdateSettings({
      ...settings,
      ...update,
      plan: currentPlan,
      updatedAt: new Date().toISOString()
    });
  }

  function saveExternalLink() {
    if (isPro) {
      updateSettings({ externalLink: externalLink.trim() });
    }
  }

  async function startSubscription() {
    if (subscriptionAction || isPro) return;
    setIsCheckoutConfirmationVisible(false);
    setSubscriptionAction("checkout");
    try {
      await onStartSubscription();
    } finally {
      setSubscriptionAction(null);
    }
  }

  async function syncSubscription() {
    if (subscriptionAction) return;
    setSubscriptionAction("sync");
    try {
      await onSyncSubscription();
    } finally {
      setSubscriptionAction(null);
    }
  }


  async function cancelSubscription() {
    if (subscriptionAction || !isPro) return;
    setIsCancelConfirmationVisible(false);
    setSubscriptionAction("cancel");
    try {
      await onCancelSubscription();
    } finally {
      setSubscriptionAction(null);
    }
  }
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <BackButton accessibilityLabel="Voltar ao perfil" onPress={onBack} />
        <Text style={s.headerTitle}>Painel profissional</Text>
        <View style={s.headerSpacer} />
      </View>

      <View style={s.hero}>
        <Text style={s.heroEyebrow}>Crescimento e publicidade</Text>
        <Text style={s.heroTitle}>
          {isPro ? "Xolot Plus ativo" : "Fortaleça sua presença profissional"}
        </Text>
        <Text style={s.heroDescription}>
          {isPro
            ? "Seu acesso pago foi confirmado pelo Mercado Pago."
            : "Ative o perfil profissional gratuitamente ou assine o Plus para liberar métricas detalhadas."}
        </Text>
        <View style={s.switchRow}>
          <View style={s.switchText}>
            <Text style={[s.optionTitle, { color: colors.onPrimary }]}>Modo profissional</Text>
            <Text style={[s.optionDescription, { color: "rgba(255,255,255,0.72)" }]}>
              Categoria atual: {getProfessionalCategoryLabel(settings.category)}
            </Text>
          </View>
          <Switch
            onValueChange={(enabled) => updateSettings({ enabled })}
            thumbColor={colors.surface}
            trackColor={{ false: "rgba(255,255,255,0.24)", true: colors.accent }}
            value={settings.enabled}
          />
        </View>
      </View>

      <View style={s.section}>
        <View style={s.row}>
          <View>
            <Text style={s.sectionTitle}>Visão geral</Text>
            <Text style={s.sectionDescription}>
              {isPro
                ? "Desempenho real do conteúdo publicado."
                : "Disponível para assinantes do Xolot Plus."}
            </Text>
          </View>
          <BarChart3 color={colors.primary} size={22} />
        </View>
        {isPro ? (
          <View style={s.metricGrid}>
            <Metric label="visualizações" value={formatCompactMetric(metrics.views)} />
            <Metric label="curtidas" value={formatCompactMetric(metrics.likes)} />
            <Metric label="mensagens" value={formatCompactMetric(metrics.messages)} />
          </View>
        ) : (
          <LockedFeature
            body="Assine para acompanhar visualizações, curtidas e contatos em um único lugar."
            title="Métricas detalhadas"
          />
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Categoria do perfil</Text>
        <Text style={s.sectionDescription}>A categoria ajuda pessoas e marcas a entender o que você oferece.</Text>
        <View style={s.categoryGrid}>
          {PROFESSIONAL_CATEGORY_OPTIONS.map((option) => {
            const active = option.id === settings.category;
            return (
              <Pressable
                accessibilityRole="button"
                key={option.id}
                onPress={() => updateSettings({ category: option.id })}
                style={[s.categoryOption, active ? s.categoryOptionActive : null]}
              >
                <Text style={[s.categoryOptionText, active ? s.categoryOptionTextActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={s.row}>
          <Text style={[s.label, { marginTop: 18 }]}>Link profissional</Text>
          {!isPro ? <LockKeyhole color={colors.muted} size={16} /> : null}
        </View>
        <View style={s.inputWithIcon}>
          <Link2 color={isPro ? colors.primary : colors.muted} size={18} />
          <TextInput
            autoCapitalize="none"
            editable={isPro}
            keyboardType="url"
            onBlur={saveExternalLink}
            onChangeText={setExternalLink}
            onSubmitEditing={saveExternalLink}
            placeholder={isPro ? "https://seusite.com.br" : "Disponível no Xolot Plus"}
            placeholderTextColor={colors.muted}
            style={s.inputFlex}
            value={externalLink}
          />
        </View>
      </View>

      <View style={s.section}>
        <View style={s.row}>
          <View>
            <Text style={s.sectionTitle}>Planos</Text>
            <Text style={s.sectionDescription}>
              {subscriptionLoading
                ? "Consultando assinatura..."
                : getProfessionalSubscriptionStatusLabel(subscription)}
            </Text>
          </View>
          <Sparkles color={colors.primary} size={22} />
        </View>

        {PROFESSIONAL_PLAN_OPTIONS.map((plan) => {
          const active = plan.id === currentPlan;
          const isPlusPlan = plan.id === "pro";
          const isBusinessPlan = plan.id === "business";

          return (
            <View
              key={plan.id}
              style={[s.planCard, active ? s.planCardActive : null]}
            >
              <View style={s.optionHeader}>
                <Text style={s.optionTitle}>{plan.label}</Text>
                <Text style={s.planPrice}>
                  {isBusinessPlan ? "Em breve" : plan.priceLabel}
                </Text>
              </View>
              <Text style={s.optionDescription}>{plan.description}</Text>
              <View style={{ marginTop: 9 }}>
                {plan.features.map((feature) => (
                  <Text key={feature} style={s.planFeature}>• {feature}</Text>
                ))}
              </View>

              {isPlusPlan ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={Boolean(subscriptionAction) || isPro}
                  onPress={() => setIsCheckoutConfirmationVisible(true)}
                  style={[
                    s.actionButton,
                    s.planAction,
                    subscriptionAction || isPro ? s.actionButtonDisabled : null
                  ]}
                >
                  {subscriptionAction === "checkout" ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <Sparkles color={colors.onPrimary} size={18} />
                  )}
                  <Text style={s.actionButtonText}>
                    {isPro
                      ? "Assinatura ativa"
                      : subscription?.status === "pending"
                        ? "Continuar pagamento"
                        : "Assinar Xolot Plus"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}

        {subscription ? (
          <Text style={s.subscriptionDetail}>
            {getProfessionalSubscriptionDetail(subscription)}
          </Text>
        ) : null}

        {subscription?.status === "pending" || subscription?.status === "paused" ? (
          <Pressable
            accessibilityRole="button"
            disabled={Boolean(subscriptionAction)}
            onPress={() => void syncSubscription()}
            style={s.secondaryAction}
          >
            {subscriptionAction === "sync" ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <RefreshCw color={colors.primary} size={17} />
            )}
            <Text style={s.secondaryActionText}>Atualizar status do pagamento</Text>
          </Pressable>
        ) : null}
        {isPro ? (
          <Pressable
            accessibilityRole="button"
            disabled={Boolean(subscriptionAction)}
            onPress={() => setIsCancelConfirmationVisible(true)}
            style={[s.secondaryAction, s.cancelAction]}
          >
            {subscriptionAction === "cancel" ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <CircleX color={colors.danger} size={17} />
            )}
            <Text style={[s.secondaryActionText, s.cancelActionText]}>
              Cancelar assinatura
            </Text>
          </Pressable>
        ) : null}


        <View style={[s.notice, { marginTop: 12 }]}>
          <Text style={s.noticeText}>
            A cobrança mensal de R$ 19,90 é processada pelo Mercado Pago. O Xolot não recebe nem armazena os dados do cartão.
          </Text>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.row}>
          <View>
            <Text style={s.sectionTitle}>Promover publicação</Text>
            <Text style={s.sectionDescription}>Publicidade vinculada a conteúdo real do seu perfil.</Text>
          </View>
          <Megaphone color={colors.primary} size={22} />
        </View>
        {isPro ? (
          <View style={[s.emptyState, { marginTop: 12 }]}>
            <BriefcaseBusiness color={colors.muted} size={28} />
            <Text style={s.emptyTitle}>Entrega patrocinada em preparação</Text>
            <Text style={s.emptyBody}>
              Esta função só será ativada quando orçamento, audiência e resultados estiverem conectados ao servidor real.
            </Text>
          </View>
        ) : (
          <LockedFeature
            body="A criação e a gestão de campanhas serão exclusivas do plano Plus."
            title="Recurso do Xolot Plus"
          />
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Campanhas</Text>
        <Text style={s.sectionDescription}>Somente campanhas reais serão exibidas neste painel.</Text>
        {isPro ? (
          <View style={[s.emptyState, { marginTop: 12 }]}>
            <Megaphone color={colors.muted} size={28} />
            <Text style={s.emptyTitle}>Nenhuma campanha ativa</Text>
            <Text style={s.emptyBody}>
              O painel não cria mais alcance estimado ou campanhas simuladas.
            </Text>
          </View>
        ) : (
          <LockedFeature
            body="Assine o Plus para acessar campanhas quando a entrega publicitária estiver disponível."
            title="Campanhas bloqueadas"
          />
        )}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsCheckoutConfirmationVisible(false)}
        transparent
        visible={isCheckoutConfirmationVisible}
      >
        <Pressable
          onPress={() => setIsCheckoutConfirmationVisible(false)}
          style={s.modalBackdrop}
        >
          <Pressable onPress={(event) => event.stopPropagation()} style={s.modalCard}>
            <Text style={s.modalTitle}>
              {subscription?.status === "pending"
                ? "Continuar assinatura?"
                : "Assinar Xolot Plus?"}
            </Text>
            <Text style={s.checkoutPrice}>R$ 19,90 por mês</Text>
            <Text style={s.modalBody}>
              A cobrança é recorrente e será processada com segurança pelo
              Mercado Pago. Você pode cancelar quando quiser.
            </Text>
            <View style={s.checkoutSummary}>
              <Text style={s.checkoutSummaryItem}>• Métricas detalhadas do perfil</Text>
              <Text style={s.checkoutSummaryItem}>• Link profissional destacado</Text>
              <Text style={s.checkoutSummaryItem}>• Acesso aos próximos recursos profissionais</Text>
            </View>
            <View style={s.modalActions}>
              <Pressable
                disabled={Boolean(subscriptionAction)}
                onPress={() => setIsCheckoutConfirmationVisible(false)}
                style={s.modalSecondaryButton}
              >
                <Text style={s.modalSecondaryButtonText}>Agora não</Text>
              </Pressable>
              <Pressable
                disabled={Boolean(subscriptionAction)}
                onPress={() => void startSubscription()}
                style={s.modalPrimaryButton}
              >
                {subscriptionAction === "checkout" ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={s.modalPrimaryButtonText}>Continuar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsCancelConfirmationVisible(false)}
        transparent
        visible={isCancelConfirmationVisible}
      >
        <Pressable
          onPress={() => setIsCancelConfirmationVisible(false)}
          style={s.modalBackdrop}
        >
          <Pressable onPress={(event) => event.stopPropagation()} style={s.modalCard}>
            <Text style={s.modalTitle}>Cancelar Xolot Plus?</Text>
            <Text style={s.modalBody}>
              A renovação será interrompida e os recursos Plus serão desativados
              quando o Mercado Pago confirmar o cancelamento.
            </Text>
            <View style={s.modalActions}>
              <Pressable
                onPress={() => setIsCancelConfirmationVisible(false)}
                style={s.modalSecondaryButton}
              >
                <Text style={s.modalSecondaryButtonText}>Manter assinatura</Text>
              </Pressable>
              <Pressable
                onPress={() => void cancelSubscription()}
                style={s.modalDangerButton}
              >
                <Text style={s.modalDangerButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function LockedFeature({ body, title }: { body: string; title: string }) {
  return (
    <View style={s.lockedFeature}>
      <LockKeyhole color={colors.primary} size={24} />
      <View style={s.lockedFeatureBody}>
        <Text style={s.lockedFeatureTitle}>{title}</Text>
        <Text style={s.lockedFeatureText}>{body}</Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metricItem}>
      <Text numberOfLines={1} style={s.metricValue}>{value}</Text>
      <Text numberOfLines={1} style={s.metricLabel}>{label}</Text>
    </View>
  );
}
