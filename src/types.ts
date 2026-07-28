export type SubmissionMediaType = "image" | "video";

export type Player = {
  id: string;
  profileId: string;
  ownerUserId?: string;
  name: string;
  username?: string;
  age: number;
  city: string;
  position: string;
  club: string;
  videoTitle: string;
  videoLength: string;
  videoUri: string | number;
  mediaType?: SubmissionMediaType;
  hasAudio?: boolean;
  isDemo?: boolean;
  highlight: string;
  tags: string[];
  mentions?: string[];
};

export type ProfessionalPlanId = "free" | "pro" | "business";

export type ProfessionalCategory =
  | "talent"
  | "creator"
  | "business"
  | "brand"
  | "project"
  | "service";

export type ProfessionalSettings = {
  category: ProfessionalCategory;
  enabled: boolean;
  externalLink: string;
  plan: ProfessionalPlanId;
  updatedAt: string;
};

export type ProfessionalSettingsByUser = Record<
  string,
  ProfessionalSettings
>;

export type CampaignObjective =
  | "reach"
  | "profile_visits"
  | "messages";

export type CampaignStatus = "active" | "paused" | "completed";

export type PromotionCampaign = {
  budget: number;
  clicks: number;
  createdAt: string;
  durationDays: number;
  estimatedReach: number;
  id: string;
  impressions: number;
  messages: number;
  objective: CampaignObjective;
  ownerUserId: string;
  playerId: string;
  profileId: string;
  status: CampaignStatus;
  title: string;
};

export type MessageContact = {
  id: string;
  profileId: string;
  name: string;
  subtitle: string;
  username?: string;
};

export type SharedPostReference = {
  authorName: string;
  caption?: string;
  mediaType: SubmissionMediaType;
  playerId: string;
  profileId: string;
  title: string;
};

export type DirectMessage = {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  createdAt: string;
  sharedPost?: SharedPostReference;
};

export type FollowingByUser = Record<string, string[]>;

export type HiddenPlayerIdsByUser = Record<string, string[]>;

export type SocialSelectionsByUser = Record<string, string[]>;

export type MessageContactsByUser = Record<string, MessageContact[]>;

export type ConversationPreferences = {
  deletedAtByContactId: Record<string, string>;
  mutedContactIds: string[];
  pinnedContactIds: string[];
};

export type ConversationPreferencesByUser = Record<
  string,
  ConversationPreferences
>;

export type ProfileAvatar = {
  cropScale: number;
  focusX: number;
  focusY: number;
  sourceHeight?: number;
  sourceWidth?: number;
  uri: string;
};

export type ProfileAvatarsByProfile = Record<string, ProfileAvatar>;

export type UserRole = "Usuário" | "Admin";


export type AccountProfile = {
  age: number | null;
  bio: string;
  city: string;
  club: string;
  name: string;
  position: string;
  username: string;
};

export type AuthProvider = "password" | "google";

export type AppUser = AccountProfile & {
  id: string;
  email: string;
  role: UserRole;
  username: string;
  acceptedTerms: boolean;
  authProvider?: AuthProvider;
  googleUid?: string;
  photoURL?: string;
  profileCompleted: boolean;
};

export type VideoSubmissionStatus =
  | "Em revisão"
  | "Ajustes solicitados"
  | "Aprovado"
  | "Reprovado";

export type VideoSubmission = {
  id: string;
  userId: string;
  athleteName: string;
  age: number;
  city: string;
  position: string;
  club: string;
  videoTitle: string;
  videoLink: string;
  mediaType?: SubmissionMediaType;
  videoDurationMs?: number;
  videoFileName?: string;
  videoFileSize?: number;
  highlight: string;
  tags?: string[];
  mentions?: string[];
  hasGuardianConsent: boolean;
  status: VideoSubmissionStatus;
  submittedAt: string;
  reviewNote?: string;
  approvedAt?: string;
};
