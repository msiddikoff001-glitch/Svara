import { useEffect, useState } from 'react';

import { DEPOSIT_METHODS } from '../../data/mocks';
import { hapticSuccess, hapticTap } from '../../services/haptics';
import { playSound } from '../../services/sound';
import type { DepositMethod } from '../../types/domain';

export type { DepositMethod };

export interface UseDepositFlowOptions {
  onDeposited?: (amount: number) => void;
}

export interface UseDepositFlowResult {
  step: number;
  methodId: string | null;
  setMethodId: (next: string | null) => void;
  amountInput: string;
  setAmountInput: (next: string) => void;
  errorMsg: string;
  setErrorMsg: (next: string) => void;
  secondsLeft: number;
  success: boolean;
  currentMethod: DepositMethod | null;
  isCard: boolean;
  goToAmount: () => void;
  validateAndAdvance: () => void;
  confirmAndAdvance: () => void;
  goBackToMethod: () => void;
}

/**
 * Step machine for the deposit flow.
 */
export function useDepositFlow({ onDeposited }: UseDepositFlowOptions): UseDepositFlowResult {
  const [step, setStep] = useState<number>(1);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(3600);
  const [success, setSuccess] = useState<boolean>(false);

  const methods = DEPOSIT_METHODS as unknown as DepositMethod[];
  const currentMethod = methods.find((m) => m.id === methodId) ?? null;
  const isCard = methodId === 'card';

  useEffect(() => {
    if (step !== 3 || !methodId) return undefined;
    const delay = isCard ? 1800 : 1500;
    const timer = setTimeout(() => setStep(isCard ? 6 : 4), delay);
    return () => clearTimeout(timer);
  }, [step, methodId, isCard]);

  useEffect(() => {
    if (step !== 5) {
      setSuccess(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      setSuccess(true);
      hapticSuccess();
      playSound('success');
    }, 6500);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    const isCryptoStep = step === 4 && methodId && !isCard;
    const isCardStep = step === 6 && isCard;
    if (!isCryptoStep && !isCardStep) return undefined;
    setSecondsLeft(isCardStep ? 900 : 3600);
    const interval = setInterval(
      () => setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000,
    );
    return () => clearInterval(interval);
  }, [step, methodId, isCard]);

  const validateAndAdvance = (): void => {
    setErrorMsg('');
    const parsedAmount = parseFloat(amountInput);
    if (!amountInput || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Введите корректную сумму');
      return;
    }
    hapticTap();
    setStep(3);
  };

  const confirmAndAdvance = (): void => {
    onDeposited?.(parseFloat(amountInput));
    setStep(5);
  };

  const goBackToMethod = (): void => {
    setStep(1);
    setErrorMsg('');
  };

  // Method → amount transition. Exposed as a named action instead of
  // leaking `setStep` so callers can't jump to arbitrary steps and the
  // flow stays the single owner of step transitions.
  const goToAmount = (): void => {
    setStep(2);
  };

  return {
    step,
    methodId,
    setMethodId,
    amountInput,
    setAmountInput,
    errorMsg,
    setErrorMsg,
    secondsLeft,
    success,
    currentMethod,
    isCard,
    goToAmount,
    validateAndAdvance,
    confirmAndAdvance,
    goBackToMethod,
  };
}
