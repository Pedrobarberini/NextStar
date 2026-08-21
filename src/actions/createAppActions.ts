import { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import { isFirebaseMediaEnabled } from "../config/firebase";
import {
  deleteCurrentFirebaseAccount,
  getSafeFirebaseAccountDeletionMessage,
  signOutFirebaseSession
} from "../services/firebaseAccountService";
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
  PublicationMediaInput,
  VideoSubmission,
  VideoSubmissionStatus
} from "../types";
import { Tab } from "../ui/types";
import {
  deleteFirebasePost,
  isFirebaseStoredPost,
  publishFirebasePost
} from "../services/firebasePostService";
import {
  deleteStoredVideo,
  persistPickedVideo
} from "../services/videoStorage";
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

  async function handleDeleteAccount() {
    if (!user) return false;

    try {
      await deleteCurrentFirebaseAccount();
    } catch (error) {
      Alert.alert(
        "Conta não excluída",
        getSafeFirebaseAccountDeletionMessage(error)
      );
      return false;
    }

    const userId = user.id;
    setCampaigns((current) =>
      current.filter((campaign) => campaign.ownerUserId !== userId)
    );
    setProfessionalSettingsByUser((current) => {
      const next = { ...current };
      delete next[userId];
      return next;
    });
    setRegisteredUsers((current) =>
      current.filter((account) => account.id !== userId)
    );
    setSubmissions((current) =>
      current.filter((submission) => submission.userId !== userId)
    );
    setSelectedAccount(null);
    setSelectedPlayer(null);
    setUser(null);
    setTab("feed");
    return true;
  }

  function handleSignOut() {
    void signOutFirebaseSession();
    setSelectedAccount(null);
    setSelectedPlayer(null);
    setUser(null);
    setTab("feed");
  }

  async function handleSubmitVideo(
    submission: VideoSubmission,
    media: PublicationMediaInput,
    onProgress: (progress: number) => void
  ) {
    if (!user || submission.userId !== user.id) {
      throw new Error("A publicação não pertence à conta conectada.");
    }

    if (!isFirebaseMediaEnabled()) {
      onProgress(0.2);
      const mediaLink = await persistPickedVideo(submission.id, {
        file: media.file,
        fileName: media.fileName,
        mimeType: media.mimeType,
        uri: media.uri
      });
      const publishedAt = new Date().toISOString();
      const localSubmission: VideoSubmission = {
        ...submission,
        approvedAt: publishedAt,
        submittedAt: publishedAt,
        videoLink: mediaLink
      };

      onProgress(1);
      setSubmissions((current) => [
        localSubmission,
        ...current.filter((item) => item.id !== localSubmission.id)
      ]);
      return localSubmission;
    }

    const publishedSubmission = await publishFirebasePost(
      submission,
      media,
      onProgress
    );
    setSubmissions((current) => [
      publishedSubmission,
      ...current.filter((item) => item.id !== publishedSubmission.id)
    ]);
    return publishedSubmission;
  }

  async function handleDeleteVideo(submission: VideoSubmission) {
    if (!user || submission.userId !== user.id) {
      return false;
    }

    if (isFirebaseStoredPost(submission)) {
      await deleteFirebasePost(submission);
    } else {
      await deleteStoredVideo(submission.videoLink).catch(() => false);
    }

    setSubmissions((current) =>
      removeOwnedVideoSubmission(current, submission.id, user.id)
    );
    setCampaigns((current) =>
      current.filter((campaign) => campaign.playerId !== `approved-${submission.id}`)
    );

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
    handleDeleteAccount,
    handleDeleteVideo,
    handleReviewSubmission,
    handleSignOut,
    handleSubmitVideo,
    handleToggleCampaign,
    handleUpdateProfessionalSettings,
    handleUpdateProfile
  };
}
