import { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import { signOutFirebaseSession } from "../services/firebaseAccountService";
import {
  InvalidPublicProfileError,
  UsernameAlreadyInUseError,
  saveFirebaseProfile
} from "../services/firebaseProfileService";
import {
  AccountProfile,
  AppUser,
  CampaignObjective,
  ProfessionalSettings,
  ProfessionalSettingsByUser,
  PromotionCampaign,
  Player,
  VideoSubmission,
  VideoSubmissionStatus
} from "../types";
import { Tab } from "../ui/types";
import { deleteStoredVideo } from "../services/videoStorage";
import { removeOwnedVideoSubmission } from "../utils/videoSubmission";
import { estimateCampaignReach } from "../utils/professional";

type CreateCampaignInput = {
  budget: number;
  durationDays: number;
  objective: CampaignObjective;
};

type CreateAppActionsOptions = {
  registeredUsers: AppUser[];
  setCampaigns: Dispatch<SetStateAction<PromotionCampaign[]>>;
  setProfessionalSettingsByUser: Dispatch<
    SetStateAction<ProfessionalSettingsByUser>
  >;
  setRegisteredUsers: Dispatch<SetStateAction<AppUser[]>>;
  setSelectedAccount: Dispatch<SetStateAction<AppUser | null>>;
  setSelectedPlayer: Dispatch<SetStateAction<Player | null>>;
  setSubmissions: Dispatch<SetStateAction<VideoSubmission[]>>;
  setTab: Dispatch<SetStateAction<Tab>>;
  setUser: Dispatch<SetStateAction<AppUser | null>>;
  user: AppUser | null;
};

export function createAppActions({
  registeredUsers,
  setCampaigns,
  setProfessionalSettingsByUser,
  setRegisteredUsers,
  setSelectedAccount,
  setSelectedPlayer,
  setSubmissions,
  setTab,
  setUser,
  user
}: CreateAppActionsOptions) {
  function handleAuth(nextUser: AppUser) {
    setRegisteredUsers((current) => {
      const accountExists = current.some((item) => item.id === nextUser.id);

      return accountExists
        ? current.map((item) => (item.id === nextUser.id ? nextUser : item))
        : [nextUser, ...current];
    });

    setSelectedAccount(null);
    setSelectedPlayer(null);
    setUser(nextUser);
    setTab(nextUser.role === "Admin" ? "admin" : "feed");
  }

  async function handleUpdateProfile(profile: AccountProfile) {
    if (!user) {
      return false;
    }

    try {
      const savedProfile = await saveFirebaseProfile(
        user.id,
        profile,
        user.photoURL ?? ""
      );
      const updatedUser: AppUser = {
        ...user,
        ...savedProfile,
        profileCompleted: true
      };

      setUser(updatedUser);
      setRegisteredUsers((current) =>
        current.some((account) => account.id === updatedUser.id)
          ? current.map((account) =>
              account.id === updatedUser.id ? updatedUser : account
            )
          : [updatedUser, ...current]
      );
      return true;
    } catch (error) {
      const message =
        error instanceof UsernameAlreadyInUseError ||
        error instanceof InvalidPublicProfileError
          ? error.message
          : "Não foi possível salvar o perfil com segurança. Tente novamente.";
      Alert.alert("Perfil não salvo", message);
      return false;
    }
  }

  function handleUpdateProfessionalSettings(settings: ProfessionalSettings) {
    if (!user) {
      return;
    }

    setProfessionalSettingsByUser((current) => ({
      ...current,
      [user.id]: {
        ...settings,
        updatedAt: new Date().toISOString()
      }
    }));
  }

  function handleCreateCampaign(player: Player, input: CreateCampaignInput) {
    if (!user || player.ownerUserId !== user.id) {
      Alert.alert(
        "Publicação indisponível",
        "Você só pode promover publicações do seu próprio perfil."
      );
      return false;
    }

    const campaign: PromotionCampaign = {
      budget: input.budget,
      clicks: 0,
      createdAt: new Date().toISOString(),
      durationDays: input.durationDays,
      estimatedReach: estimateCampaignReach(
        input.budget,
        input.durationDays,
        input.objective
      ),
      id: `campaign-${Date.now()}`,
      impressions: 0,
      messages: 0,
      objective: input.objective,
      ownerUserId: user.id,
      playerId: player.id,
      profileId: player.profileId,
      status: "active",
      title: player.videoTitle
    };

    setCampaigns((current) => [campaign, ...current]);
    Alert.alert(
      "Campanha criada",
      "A promoção foi adicionada ao painel. Nenhuma cobrança será feita nesta fase."
    );
    return true;
  }

  function handleToggleCampaign(campaignId: string) {
    if (!user) {
      return;
    }

    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId && campaign.ownerUserId === user.id
          ? {
              ...campaign,
              status: campaign.status === "active" ? "paused" : "active"
            }
          : campaign
      )
    );
  }

  function handleSignOut() {
    void signOutFirebaseSession();
    setSelectedAccount(null);
    setSelectedPlayer(null);
    setUser(null);
    setTab("feed");
  }

  function handleSubmitVideo(submission: VideoSubmission) {
    setSubmissions((current) => [submission, ...current]);
  }

  async function handleDeleteVideo(submission: VideoSubmission) {
    if (!user || submission.userId !== user.id) {
      return false;
    }

    setSubmissions((current) =>
      removeOwnedVideoSubmission(current, submission.id, user.id)
    );
    setCampaigns((current) =>
      current.filter((campaign) => campaign.playerId !== `approved-${submission.id}`)
    );
    await deleteStoredVideo(submission.videoLink).catch(() => false);

    return true;
  }

  function handleReviewSubmission(
    submissionId: string,
    status: VideoSubmissionStatus,
    reviewNote: string
  ) {
    setSubmissions((current) =>
      current.map((submission) => {
        if (submission.id !== submissionId) {
          return submission;
        }

        return {
          ...submission,
          status,
          reviewNote,
          approvedAt:
            status === "Aprovado"
              ? new Date().toISOString()
              : submission.approvedAt
        };
      })
    );
  }

  return {
    handleAuth,
    handleCreateCampaign,
    handleDeleteVideo,
    handleReviewSubmission,
    handleSignOut,
    handleSubmitVideo,
    handleToggleCampaign,
    handleUpdateProfessionalSettings,
    handleUpdateProfile
  };
}
