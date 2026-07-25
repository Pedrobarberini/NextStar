import React, { useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Link2,
  Megaphone,
  Pause,
  Play,
  Sparkles
} from "lucide-react-native";
import {
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
  PromotionCampaign
} from "../types";
import {
  PROFESSIONAL_CATEGORY_OPTIONS,
  PROFESSIONAL_PLAN_OPTIONS,
  formatCompactMetric,
  getCampaignObjectiveLabel,
  getProfessionalCategoryLabel,
  getProfessionalPlanLabel
} from "../utils/professional";

export function ProfessionalDashboardScreen({
  campaigns,
  metrics,
  onBack,
  onPromotePost,
  onToggleCampaign,
  onUpdateSettings,
  posts,
  settings
}: {
  campaigns: PromotionCampaign[];
  metrics: {
    likes: number;
    messages: number;
    posts: number;
    views: number;
  };
  onBack: () => void;
  onPromotePost: (player: Player) => void;
  onToggleCampaign: (campaignId: string) => void;
  onUpdateSettings: (settings: ProfessionalSettings) => void;
  posts: Player[];
  settings: ProfessionalSettings;
}) {
  const [externalLink, setExternalLink] = useState(settings.externalLink);

  function updateSettings(update: Partial<ProfessionalSettings>) {
    onUpdateSettings({
      ...settings,
      ...update,
      updatedAt: new Date().toISOString()
    });
  }

  function saveExternalLink() {
    updateSettings({ externalLink: externalLink.trim() });
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
          {settings.enabled ? "Seu perfil está profissional" : "Ative seu perfil profissional"}
        </Text>
        <Text style={s.heroDescription}>
          Acompanhe resultados, organize sua presença e promova publicações para alcançar novas pessoas.
        </Text>
        <View style={s.switchRow}>
          <View style={s.switchText}>
            <Text style={[s.optionTitle, { color: colors.onPrimary }]}>Modo profissional</Text>
            <Text style={[s.optionDescription, { color: "rgba(255,255,255,0.72)" }]}>Categoria atual: {getProfessionalCategoryLabel(settings.category)}</Text>
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
            <Text style={s.sectionDescription}>Desempenho orgânico do seu conteúdo.</Text>
          </View>
          <BarChart3 color={colors.primary} size={22} />
        </View>
        <View style={s.metricGrid}>
          <Metric label="visualizações" value={formatCompactMetric(metrics.views)} />
          <Metric label="curtidas" value={formatCompactMetric(metrics.likes)} />
          <Metric label="mensagens" value={formatCompactMetric(metrics.messages)} />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Categoria do perfil</Text>
        <Text style={s.sectionDescription}>Ajuda pessoas e marcas a entenderem o que você oferece.</Text>
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
                <Text style={[s.categoryOptionText, active ? s.categoryOptionTextActive : null]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[s.label, { marginTop: 18 }]}>Link profissional</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="url"
          onBlur={saveExternalLink}
          onChangeText={setExternalLink}
          onSubmitEditing={saveExternalLink}
          placeholder="https://seusite.com.br"
          placeholderTextColor={colors.muted}
          style={s.input}
          value={externalLink}
        />
      </View>

      <View style={s.section}>
        <View style={s.row}>
          <View>
            <Text style={s.sectionTitle}>Planos</Text>
            <Text style={s.sectionDescription}>Atual: {getProfessionalPlanLabel(settings.plan)}</Text>
          </View>
          <Sparkles color={colors.primary} size={22} />
        </View>
        {PROFESSIONAL_PLAN_OPTIONS.map((plan) => {
          const active = plan.id === settings.plan;
          return (
            <Pressable
              accessibilityRole="button"
              key={plan.id}
              onPress={() => updateSettings({ plan: plan.id })}
              style={[s.planCard, active ? s.planCardActive : null]}
            >
              <View style={s.optionHeader}>
                <Text style={s.optionTitle}>{plan.label}</Text>
                <Text style={s.planPrice}>{plan.priceLabel}</Text>
              </View>
              <Text style={s.optionDescription}>{plan.description}</Text>
              <View style={{ marginTop: 9 }}>
                {plan.features.map((feature) => (
                  <Text key={feature} style={s.planFeature}>• {feature}</Text>
                ))}
              </View>
            </Pressable>
          );
        })}
        <View style={[s.notice, { marginTop: 12 }]}>
          <Text style={s.noticeText}>Os planos pagos estão em pré-lançamento. Sua escolha fica salva, mas nenhuma cobrança é realizada agora.</Text>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.row}>
          <View>
            <Text style={s.sectionTitle}>Promover publicação</Text>
            <Text style={s.sectionDescription}>Escolha um conteúdo do seu perfil.</Text>
          </View>
          <Megaphone color={colors.primary} size={22} />
        </View>
        {posts.length === 0 ? (
          <View style={[s.emptyState, { marginTop: 12 }]}>
            <BriefcaseBusiness color={colors.muted} size={28} />
            <Text style={s.emptyTitle}>Nenhuma publicação disponível</Text>
            <Text style={s.emptyBody}>Publique uma foto ou vídeo para criar sua primeira campanha.</Text>
          </View>
        ) : (
          posts.map((post, index) => (
            <View key={post.id} style={[s.postItem, index === 0 ? s.postItemFirst : null]}>
              <View style={s.postMediaIcon}>
                <Play color={colors.primary} size={20} fill={colors.primary} />
              </View>
              <View style={s.postText}>
                <Text numberOfLines={1} style={s.postTitle}>{post.videoTitle}</Text>
                <Text style={s.postType}>{post.mediaType === "image" ? "Foto" : "Vídeo"}</Text>
              </View>
              <Pressable onPress={() => onPromotePost(post)} style={s.inlineButton}>
                <Megaphone color={colors.text} size={15} />
                <Text style={s.inlineButtonText}>Promover</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Campanhas</Text>
        <Text style={s.sectionDescription}>{campaigns.length} {campaigns.length === 1 ? "campanha criada" : "campanhas criadas"}</Text>
        {campaigns.length === 0 ? (
          <View style={[s.emptyState, { marginTop: 12 }]}>
            <Megaphone color={colors.muted} size={28} />
            <Text style={s.emptyTitle}>Comece com uma publicação</Text>
            <Text style={s.emptyBody}>Suas promoções e resultados aparecerão aqui.</Text>
          </View>
        ) : (
          campaigns.map((campaign, index) => (
            <View key={campaign.id} style={[s.campaignItem, index === 0 ? s.campaignItemFirst : null]}>
              <View style={s.row}>
                <Text numberOfLines={1} style={s.campaignTitle}>{campaign.title}</Text>
                <Text style={[s.campaignStatus, campaign.status !== "active" ? s.campaignStatusPaused : null]}>{campaign.status === "active" ? "Ativa" : campaign.status === "paused" ? "Pausada" : "Concluída"}</Text>
              </View>
              <Text style={s.campaignMeta}>{getCampaignObjectiveLabel(campaign.objective)} · alcance estimado {formatCompactMetric(campaign.estimatedReach)} · {campaign.durationDays} dias</Text>
              {campaign.status !== "completed" ? (
                <Pressable onPress={() => onToggleCampaign(campaign.id)} style={[s.inlineButton, { alignSelf: "flex-start" }]}>
                  {campaign.status === "active" ? <Pause color={colors.text} size={15} /> : <Play color={colors.text} size={15} />}
                  <Text style={s.inlineButtonText}>{campaign.status === "active" ? "Pausar" : "Retomar"}</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
