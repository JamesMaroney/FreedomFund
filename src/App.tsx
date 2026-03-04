import { useReducer, useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import useLocalStorage from "./hooks/useLocalStorage";
import { useCelebration } from "./hooks/useCelebration";
import { calculateNewStreak, getTodayString } from "./hooks/useStreak";
import type {
  FreedomFundState,
  AppUIState,
  AppAction,
  Deposit,
  AudioClip,
  TipPreset,
  Goals,
} from "./types";
import {
  MILESTONE_AMOUNTS,
  DEFAULT_WEEKLY_GOAL_CENTS,
  DEFAULT_TIP_PRESETS,
  DEFAULT_GOALS,
} from "./constants/presets";
import { generateId } from "./utils/id";
import { primeAudio } from "./utils/audio";
import HomeScreen from "./components/HomeScreen";
import AmountSelector from "./components/AmountSelector";
import CelebrationOverlay from "./components/CelebrationOverlay";
import TransferButton from "./components/TransferButton";
import MilestoneToast from "./components/MilestoneToast";
import SettingsPanel from "./components/SettingsPanel";
import "./App.css";

const DEFAULT_FUND_STATE: FreedomFundState = {
  totalSaved: 0,
  currentStreak: 0,
  lastDepositDate: "",
  deposits: [],
  weeklyGoal: DEFAULT_WEEKLY_GOAL_CENTS,
  milestones: [],
  challengeStartDate: getTodayString(),
  goals: DEFAULT_GOALS,
  tipPresets: DEFAULT_TIP_PRESETS,
};

function uiReducer(state: AppUIState, action: AppAction): AppUIState {
  switch (action.type) {
    case "OPEN_SELECTOR":
      return { ...state, screen: "SELECTING_AMOUNT" };
    case "CONFIRM_DEPOSIT":
      return {
        ...state,
        screen: "CELEBRATING",
        pendingAmount: action.amount,
        pendingLabel: action.label,
      };
    case "CELEBRATION_COMPLETE":
      return { ...state, screen: "TRANSFER_PROMPT" };
    case "MARK_TRANSFERRED":
    case "DISMISS":
      return {
        screen: "IDLE",
        pendingAmount: 0,
        pendingLabel: "",
        lastDepositId: null,
      };
    default:
      return state;
  }
}

const INITIAL_UI: AppUIState = {
  screen: "IDLE",
  pendingAmount: 0,
  pendingLabel: "",
  lastDepositId: null,
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function App() {
  const [fundState, setFundState] = useLocalStorage<FreedomFundState>(
    "freedom-fund-state",
    DEFAULT_FUND_STATE,
  );
  const [ui, dispatch] = useReducer(uiReducer, INITIAL_UI);
  const [milestoneHit, setMilestoneHit] = useState<number | null>(null);
  const [lastDepositId, setLastDepositId] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioClip, setAudioClip] = useLocalStorage<AudioClip>(
    "freedom-fund-audio-clip",
    "coins",
  );
  const { trigger: triggerCelebration } = useCelebration(audioClip);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleTipYourself = useCallback(() => {
    dispatch({ type: "OPEN_SELECTOR" });
  }, []);

  const handleSelectAmount = useCallback(
    (amount: number, label: string) => {
      const today = getTodayString();
      const newStreak = calculateNewStreak(
        fundState.currentStreak,
        fundState.lastDepositDate,
      );
      const newTotal = fundState.totalSaved + amount;

      const deposit: Deposit = {
        id: generateId(),
        amount,
        label,
        timestamp: new Date().toISOString(),
        transferred: false,
      };

      const newMilestone = MILESTONE_AMOUNTS.find(
        (m) => !fundState.milestones.includes(m * 100) && newTotal >= m * 100,
      );

      setFundState((prev) => ({
        ...prev,
        totalSaved: newTotal,
        currentStreak: newStreak,
        lastDepositDate: today,
        deposits: [deposit, ...prev.deposits],
        milestones: newMilestone
          ? [...prev.milestones, newMilestone * 100]
          : prev.milestones,
      }));

      setLastDepositId(deposit.id);
      dispatch({ type: "CONFIRM_DEPOSIT", amount, label });

      // primeAudio must run synchronously inside the gesture handler
      primeAudio();

      if (newMilestone) {
        setMilestoneHit(newMilestone);
        triggerCelebration({ isMilestone: true });
      } else {
        triggerCelebration();
      }
    },
    [fundState, setFundState, triggerCelebration],
  );

  const handleCelebrationComplete = useCallback(() => {
    dispatch({ type: "CELEBRATION_COMPLETE" });
  }, []);

  const handleMarkTransferred = useCallback(() => {
    if (lastDepositId) {
      setFundState((prev) => ({
        ...prev,
        deposits: prev.deposits.map((d) =>
          d.id === lastDepositId ? { ...d, transferred: true } : d,
        ),
      }));
    }
    dispatch({ type: "MARK_TRANSFERRED" });
  }, [lastDepositId, setFundState]);

  const handleDismiss = useCallback(() => {
    dispatch({ type: "DISMISS" });
  }, []);

  const handleInstallPWA = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setInstallPrompt(null);
  }, [installPrompt]);

  const handleReset = useCallback(() => {
    setFundState((prev) => {
      const unsentAmount = prev.deposits
        .filter((d) => !d.transferred)
        .reduce((sum, d) => sum + d.amount, 0);
      return {
        ...prev,
        totalSaved: prev.totalSaved - unsentAmount,
        deposits: prev.deposits.filter((d) => d.transferred),
      };
    });
  }, [setFundState]);

  return (
    <div className="app-root">
      <AnimatePresence mode="wait">
        {ui.screen === "IDLE" && (
          <HomeScreen
            key="home"
            fundState={fundState}
            onTipYourself={handleTipYourself}
            onOpenSettings={() => setSettingsOpen(true)}
            installPrompt={installPrompt !== null}
            onInstall={handleInstallPWA}
          />
        )}
        {ui.screen === "SELECTING_AMOUNT" && (
          <AmountSelector
            key="selector"
            tipPresets={fundState.tipPresets ?? DEFAULT_TIP_PRESETS}
            onSelect={handleSelectAmount}
            onBack={handleDismiss}
          />
        )}
        {ui.screen === "CELEBRATING" && (
          <CelebrationOverlay
            key="celebration"
            amount={ui.pendingAmount}
            label={ui.pendingLabel}
            isMilestone={!!milestoneHit}
            onComplete={handleCelebrationComplete}
          />
        )}
        {ui.screen === "TRANSFER_PROMPT" && (
          <TransferButton
            key="transfer"
            amount={ui.pendingAmount}
            onTransfer={handleMarkTransferred}
            onSkip={handleDismiss}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {milestoneHit !== null && (
          <MilestoneToast
            key="milestone"
            amount={milestoneHit}
            onDismiss={() => setMilestoneHit(null)}
          />
        )}
      </AnimatePresence>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        audioClip={audioClip}
        onAudioClipChange={setAudioClip}
        goals={fundState.goals ?? DEFAULT_GOALS}
        onGoalsChange={(g: Goals) =>
          setFundState((prev) => ({ ...prev, goals: g }))
        }
        tipPresets={fundState.tipPresets ?? DEFAULT_TIP_PRESETS}
        onTipPresetsChange={(p: TipPreset[]) =>
          setFundState((prev) => ({ ...prev, tipPresets: p }))
        }
        deposits={fundState.deposits}
        onSendToAlly={() =>
          window.open("https://ally.com", "_blank", "noopener,noreferrer")
        }
        onReset={handleReset}
      />
    </div>
  );
}
