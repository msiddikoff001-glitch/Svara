import { memo, useCallback, useState } from 'react';

import { DepositCountdown } from '../../../components/ui/DepositCountdown';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { hapticTap } from '../../../services/haptics';
import { CopyRow } from '../components/CopyRow';
import { CopyToast } from '../components/CopyToast';
import { MethodHeader } from '../components/MethodHeader';
import { WarningRow } from '../components/WarningRow';
import styles from '../DepositSheet.module.css';

// TODO(backend): once `paymentsApi.createDeposit()` is live, the deposit
// address is returned per-method from the server. Strip the local mocks.
const MOCK_DEPOSIT_ADDRESSES: Record<'ton' | 'usdt', string> = {
  ton: 'UQBxxxxxxxxxxxxxxxxxxxxxxxxK9f',
  usdt: 'TRXxxxxxxxxxxxxxxxxxxxxm4Kz',
};

export interface CryptoPaymentStepMethod {
  id: string;
  label: string;
  coin: string | null;
  netName: string | null;
  network: string | null;
}

function getDepositAddress(method?: CryptoPaymentStepMethod | null): string {
  if (!method) return '';
  if (method.id === 'ton' || method.id === 'usdt') {
    return MOCK_DEPOSIT_ADDRESSES[method.id];
  }
  return MOCK_DEPOSIT_ADDRESSES.usdt;
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard?.writeText(text);
  } catch {
    /* clipboard unavailable */
  }
}

export interface CryptoPaymentStepProps {
  method: CryptoPaymentStepMethod;
  amount: string;
  secondsLeft: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function CryptoPaymentStepImpl({
  method,
  amount,
  secondsLeft,
  onConfirm,
  onCancel,
}: CryptoPaymentStepProps) {
  const [copied, setCopied] = useState(false);
  const depositAddress = getDepositAddress(method);
  const amountFixed = parseFloat(amount).toFixed(2);
  const amountUnit = method.id === 'ton' ? 'TON' : 'USDT';

  const handleCopy = useCallback(() => {
    copyToClipboard(depositAddress);
    hapticTap();
    setCopied(true);
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [depositAddress]);

  return (
    <div>
      <MethodHeader
        method={method}
        variant="centered"
        label={'Пополнение ' + method.label}
      />
      <WarningRow
        title={`Отправляйте только ${method.coin} в сети ${method.netName}`}
        sub="Использование другой сети может привести к утрате средств."
      />
      <div className={styles.fieldLabel}>Сумма к отправке</div>
      <div className={styles.amountRow}>
        <span className={styles.amountValue}>
          {amountFixed} {amountUnit}
        </span>
        <span className={styles.amountConvert}>≈ ${amountFixed}</span>
      </div>
      <div className={styles.fieldLabel}>{`Адрес для отправки (${method.network})`}</div>
      <CopyRow value={depositAddress} copied={copied} onCopy={handleCopy} mono="address" />
      <DepositCountdown secondsLeft={secondsLeft} />
      {copied && <CopyToast message="✓ Адрес скопирован" />}
      <PrimaryButton onClick={onConfirm} disabled={secondsLeft <= 0}>
        Я отправил
      </PrimaryButton>
      <button type="button" onClick={onCancel} className={styles.cancelButton}>
        Отменить
      </button>
    </div>
  );
}

export const CryptoPaymentStep = memo(CryptoPaymentStepImpl);
