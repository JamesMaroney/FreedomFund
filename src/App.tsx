import { useReducer, useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useRegisterSW } from "virtual:pwa-register/react";
import useLocalStorage from "./hooks/useLocalStorage";
import { useCelebration } from "./hooks/useCelebration";
import { calculateNewStreak, getTodayString } from "./hooks/useStreak";
import type {
  FreedomFundState,
  Deposit,
  AudioClip,
  TipPreset,
  Goals,
  ProjectionSettings,
  CurrencyLocale,
  BankSettings,
} from "./types";
import {
  MILESTONE_AMOUNTS,
  DEFAULT_TIP_PRESETS,
  DEFAULT_GOALS,
  DEFAULT_PROJECTION_SETTINGS,
  DEFAULT_CURRENCY_LOCALE,
  DEFAULT_BANK_SETTINGS,
  BANK_OPTIONS,
} from "./constants/presets";
import { generateId } from "./utils/id";
import { primeAudio } from "./utils/audio";
import { getUnsentCents, findNewMilestone, markAllTransferred } from "./utils/deposits";
import { uiReducer, INITIAL_UI } from "./store/uiReducer";
import HomeScreen from "./components/HomeScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import AmountSelector from "./components/AmountSelector";
import CelebrationOverlay from "./components/CelebrationOverlay";
import TransferButton from "./components/TransferButton";
import TransferConfirmCard from "./components/TransferConfirmCard";
import MilestoneToast from "./components/MilestoneToast";
import UpdateToast from "./components/UpdateToast";
import TransferModal from "./components/TransferModal";
import SettingsPanel from "./components/SettingsPanel";
import "./App.css";

const DEFAULT_FUND_STATE: FreedomFundState = {
  totalSaved: 0,
  currentStreak: 0,
  lastDepositDate: "",
  deposits: [],
  weeklyGoal: 10000,
  milestones: [],
  challengeStartDate: getTodayString(),
  goals: DEFAULT_GOALS,
  tipPresets: DEFAULT_TIP_PRESETS,
  projectionSettings: DEFAULT_PROJECTION_SETTINGS,
  currencyLocale: DEFAULT_CURRENCY_LOCALE,
  bankSettings: DEFAULT_BANK_SETTINGS,
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

  // Normalise optional fields once so the rest of the component never needs `?? DEFAULT_X`
  const projectionSettings = fundState.projectionSettings ?? DEFAULT_PROJECTION_SETTINGS;
  const currencyLocale = fundState.currencyLocale ?? DEFAULT_CURRENCY_LOCALE;
  const bankSettings = fundState.bankSettings ?? DEFAULT_BANK_SETTINGS;
  const tipPresets = fundState.tipPresets ?? DEFAULT_TIP_PRESETS;
  const goals = fundState.goals ?? DEFAULT_GOALS;
  const unsentCents = getUnsentCents(fundState.deposits);
  const [ui, dispatch] = useReducer(uiReducer, INITIAL_UI);
  const [milestoneHit, setMilestoneHit] = useState<number | null>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transferPending, setTransferPending] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [skipTransferModal, setSkipTransferModal] = useLocalStorage<boolean>("freedom-fund-skip-transfer-modal", false);
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>("freedom-fund-seen-welcome", false);
  const awaitingTransferReturn = useRef(false);
  const [audioClip, setAudioClip] = useLocalStorage<AudioClip>(
    "freedom-fund-audio-clip",
    "coins",
  );
  const { trigger: triggerCelebration } = useCelebration(audioClip);

  // updateReady: latches true when a waiting SW is detected, never resets to false
  // (dismissing the toast hides it but doesn't clear this — settings still shows the button)
  const [updateReady, setUpdateReady] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(reg) {
      // When useRegisterSW detects a waiting worker, mirror it into our own state
      if (reg?.waiting) {
        setUpdateReady(true);
        setToastVisible(true);
      }
    },
  });

  // Also react to needRefresh going true (the normal detection path)
  useEffect(() => {
    if (needRefresh) {
      setUpdateReady(true);
      setToastVisible(true);
    }
  }, [needRefresh]);

  const handleUpdate = useCallback(() => updateServiceWorker(true), [updateServiceWorker]);
  const handleDismissUpdate = useCallback(() => {
    setToastVisible(false);
    setNeedRefresh(false); // stop useRegisterSW re-showing it
  }, [setNeedRefresh]);
  const handleCheckForUpdates = useCallback(async () => {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.waiting) {
      // There's already a waiting worker (user dismissed the toast earlier)
      setUpdateReady(true);
      return;
    }
    if (reg) await reg.update();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Check for a new service worker every time the app comes into focus
        navigator.serviceWorker?.getRegistration().then((reg) => reg?.update());

        if (awaitingTransferReturn.current) {
          awaitingTransferReturn.current = false;
          setTransferPending(true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleTipYourself = useCallback(() => {
    // Prime audio here (first gesture) so the AudioContext is fully running
    // by the time the celebration sound fires on the chip-tap (second gesture).
    primeAudio();
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

      const newMilestone = findNewMilestone(MILESTONE_AMOUNTS, fundState.milestones, newTotal);

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

      dispatch({ type: "CONFIRM_DEPOSIT", amount, label });

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
    setFundState((prev) => ({
      ...prev,
      totalSaved: prev.totalSaved - getUnsentCents(prev.deposits),
      deposits: prev.deposits.filter((d) => d.transferred),
    }));
  }, [setFundState]);

  const doOpenBank = useCallback(() => {
    const bank = BANK_OPTIONS.find((b) => b.id === bankSettings.bankId) ?? BANK_OPTIONS[0];
    awaitingTransferReturn.current = true;
    const a = document.createElement("a");
    a.href = bank.transferUrl;
    a.rel = "noopener noreferrer";
    a.click();
  }, [bankSettings.bankId]);

  const handleSendToBank = useCallback(() => {
    if (bankSettings.enabled) {
      // Copy amount to clipboard immediately so it's ready regardless of modal path
      navigator.clipboard.writeText(`${(unsentCents / 100).toFixed(2)}`).catch(() => {});
      if (skipTransferModal) {
        doOpenBank();
      } else {
        setTransferModalOpen(true);
      }
    } else {
      // No bank connected — mark all deposits as transferred immediately
      setFundState((prev) => ({ ...prev, deposits: markAllTransferred(prev.deposits) }));
    }
  }, [bankSettings.enabled, unsentCents, skipTransferModal, doOpenBank, setFundState]);

  const handleTransferConfirm = useCallback((skipNext: boolean) => {
    if (skipNext) setSkipTransferModal(true);
    setTransferModalOpen(false);
    doOpenBank();
  }, [doOpenBank, setSkipTransferModal]);

  const handleTransferCancel = useCallback(() => {
    setTransferModalOpen(false);
  }, []);

  return (
    <div className="app-root">
      <AnimatePresence mode="wait">
        {!hasSeenWelcome && (
          <WelcomeScreen
            key="welcome"
            onGetStarted={() => setHasSeenWelcome(true)}
          />
        )}
        {hasSeenWelcome && ui.screen === "IDLE" && (
          <HomeScreen
            key="home"
            fundState={fundState}
            onTipYourself={handleTipYourself}
            onOpenSettings={() => setSettingsOpen(true)}
            installPrompt={installPrompt !== null}
            onInstall={handleInstallPWA}
            projectionSettings={projectionSettings}
            currencyLocale={currencyLocale}
            bankSettings={bankSettings}
            unsentCents={unsentCents}
            onSendToBank={handleSendToBank}
          />
        )}
        {hasSeenWelcome && ui.screen === "SELECTING_AMOUNT" && (
          <AmountSelector
            key="selector"
            tipPresets={tipPresets}
            currencyLocale={currencyLocale}
            onSelect={handleSelectAmount}
            onBack={handleDismiss}
          />
        )}
        {hasSeenWelcome && ui.screen === "CELEBRATING" && (
          <CelebrationOverlay
            key="celebration"
            amount={ui.pendingAmount}
            label={ui.pendingLabel}
            isMilestone={!!milestoneHit}
            currencyLocale={currencyLocale}
            onComplete={handleCelebrationComplete}
          />
        )}
        {hasSeenWelcome && ui.screen === "TRANSFER_PROMPT" && (
          <TransferButton
            key="transfer"
            amount={ui.pendingAmount}
            totalSavedCents={fundState.totalSaved}
            projectionSettings={projectionSettings}
            currencyLocale={currencyLocale}
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

      <AnimatePresence>
        {transferPending && (
          <TransferConfirmCard
            key="transfer-confirm"
            unsentCents={unsentCents}
            currencyLocale={currencyLocale}
            onConfirm={() => {
              setFundState((prev) => ({ ...prev, deposits: markAllTransferred(prev.deposits) }));
              setTransferPending(false);
            }}
            onDismiss={() => setTransferPending(false)}
          />
        )}
      </AnimatePresence>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        audioClip={audioClip}
        onAudioClipChange={setAudioClip}
        goals={goals}
        onGoalsChange={(g: Goals) => setFundState((prev) => ({ ...prev, goals: g }))}
        tipPresets={tipPresets}
        onTipPresetsChange={(p: TipPreset[]) => setFundState((prev) => ({ ...prev, tipPresets: p }))}
        projectionSettings={projectionSettings}
        onProjectionSettingsChange={(ps: ProjectionSettings) => setFundState((prev) => ({ ...prev, projectionSettings: ps }))}
        currencyLocale={currencyLocale}
        onCurrencyLocaleChange={(cl: CurrencyLocale) => setFundState((prev) => ({ ...prev, currencyLocale: cl }))}
        unsentCents={unsentCents}
        onSendToBank={handleSendToBank}
        bankSettings={bankSettings}
        onBankSettingsChange={(bs: BankSettings) => setFundState((prev) => ({ ...prev, bankSettings: bs }))}
        onReset={handleReset}
        needRefresh={updateReady}
        onUpdate={handleUpdate}
        onCheckForUpdates={handleCheckForUpdates}
      />
      <UpdateToast needRefresh={toastVisible} onUpdate={handleUpdate} onDismiss={handleDismissUpdate} />
      {bankSettings.enabled && (
        <TransferModal
          isOpen={transferModalOpen}
          amountCents={unsentCents}
          bankLabel={BANK_OPTIONS.find((b) => b.id === bankSettings.bankId)?.label ?? 'your bank'}
          currencyLocale={currencyLocale}
          onConfirm={handleTransferConfirm}
          onCancel={handleTransferCancel}
        />
      )}
    </div>
  );
}
