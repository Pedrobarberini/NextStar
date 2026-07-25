import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AppUser, Player } from "../types.ts";
import type { Tab } from "../ui/types.ts";

export type ReelReturnTarget =
  | { type: "own-profile" }
  | { contactId: string; type: "messages" }
  | { account?: AppUser; player: Player; type: "public-profile" };

export function useAppNavigation() {
  const [tab, setTab] = useState<Tab>("feed");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AppUser | null>(null);
  const [campaignPlayer, setCampaignPlayer] = useState<Player | null>(null);
  const [feedFocusPlayerId, setFeedFocusPlayerId] = useState<string | null>(null);
  const [reelReturnTarget, setReelReturnTarget] =
    useState<ReelReturnTarget | null>(null);
  const [activeMessageContactId, setActiveMessageContactId] = useState<
    string | null
  >(null);

  const clearSelectedProfile = useCallback(() => {
    setSelectedAccount(null);
    setSelectedPlayer(null);
  }, []);

  const openPlayerProfile = useCallback((player: Player) => {
    setReelReturnTarget(null);
    setSelectedAccount(null);
    setSelectedPlayer(player);
  }, []);

  const openUserProfile = useCallback((account: AppUser) => {
    setSelectedPlayer(null);
    setSelectedAccount(account);
  }, []);

  const closeCampaign = useCallback(() => {
    setCampaignPlayer(null);
  }, []);

  const openCampaign = useCallback((player: Player) => {
    setCampaignPlayer(player);
  }, []);

  const openTab = useCallback((nextTab: Tab) => {
    setCampaignPlayer(null);
    setReelReturnTarget(null);
    setSelectedAccount(null);
    setSelectedPlayer(null);
    setFeedFocusPlayerId(null);
    setTab(nextTab);
  }, []);

  const openReel = useCallback(
    (player: Player, returnTarget: ReelReturnTarget | null = null) => {
      setCampaignPlayer(null);
      setReelReturnTarget(returnTarget);
      setSelectedAccount(null);
      setSelectedPlayer(null);
      setFeedFocusPlayerId(player.id);
      setTab("feed");
    },
    []
  );

  const returnToReelOrigin = useCallback(() => {
    if (!reelReturnTarget) {
      return;
    }

    const returnTarget = reelReturnTarget;

    setReelReturnTarget(null);
    if (returnTarget.type === "own-profile") {
      setTab("profile");
      return;
    }

    if (returnTarget.type === "messages") {
      setActiveMessageContactId(returnTarget.contactId);
      setTab("messages");
      return;
    }

    setSelectedAccount(returnTarget.account ?? null);
    setSelectedPlayer(returnTarget.player);
  }, [reelReturnTarget]);

  const openMessageContact = useCallback((contactId: string) => {
    setActiveMessageContactId(contactId);
    setCampaignPlayer(null);
    setSelectedAccount(null);
    setSelectedPlayer(null);
    setTab("messages");
  }, []);

  const resetSessionNavigation = useCallback(() => {
    setActiveMessageContactId(null);
    setCampaignPlayer(null);
  }, []);

  const focusFeedPlayer = useCallback((playerId: string) => {
    setFeedFocusPlayerId(playerId);
  }, []);

  return {
    activeMessageContactId,
    campaignPlayer,
    clearSelectedProfile,
    closeCampaign,
    feedFocusPlayerId,
    focusFeedPlayer,
    openCampaign,
    openMessageContact,
    openPlayerProfile,
    openReel,
    openTab,
    openUserProfile,
    reelReturnTarget,
    resetSessionNavigation,
    returnToReelOrigin,
    selectedAccount,
    selectedPlayer,
    setActiveMessageContactId:
      setActiveMessageContactId as Dispatch<SetStateAction<string | null>>,
    setSelectedAccount:
      setSelectedAccount as Dispatch<SetStateAction<AppUser | null>>,
    setSelectedPlayer:
      setSelectedPlayer as Dispatch<SetStateAction<Player | null>>,
    setTab: setTab as Dispatch<SetStateAction<Tab>>,
    tab
  };
}
