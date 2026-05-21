import { memo, useEffect, useState } from 'react';

import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { Sheet } from '../../../components/ui/Sheet';
import { TextInput } from '../../../components/ui/TextInput';
import { COLORS } from '../../../designSystem';
import { hapticSuccess } from '../../../services/haptics';
import styles from './WalletSheet.module.css';

const NETWORKS = ['USDT TRC20', 'TON'] as const;
type NetworkName = (typeof NETWORKS)[number];

interface WalletSavedConfirmationProps {
  network: NetworkName;
  address: string;
}

function WalletSavedConfirmation({ network, address }: WalletSavedConfirmationProps) {
  return (
    <div className={styles.successWrap}>
      <div className={styles.successCircle}>
        <svg
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 12 10 18 20 7" className={styles.successCheck} />
        </svg>
      </div>
      <div className={styles.successTitle}>Адрес успешно добавлен</div>
      <div className={styles.successSub}>
        {network} · {address.slice(0, 6)}…{address.slice(-4)}
      </div>
    </div>
  );
}

/**
 * "Кошелек для вывода" sheet. Owns its own input/network state and
 * auto-closes ~1.8s after the success animation finishes.
 *
 * The parent only knows whether the sheet is open and gets the final
 * saved value back via `onSaved`.
 */
export interface WalletSheetProps {
  initialAddress?: string;
  onClose: () => void;
  onSaved: (address: string) => void;
}

function WalletSheetImpl({ initialAddress, onClose, onSaved }: WalletSheetProps) {
  const [address, setAddress] = useState<string>(initialAddress ?? '');
  const [network, setNetwork] = useState<NetworkName>('USDT TRC20');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!savedSuccess) return undefined;
    const timer = setTimeout(() => {
      setSavedSuccess(false);
      onSaved(address);
      onClose();
    }, 1800);
    return () => clearTimeout(timer);
  }, [savedSuccess, address, onSaved, onClose]);

  return (
    <Sheet
      onClose={() => {
        if (!savedSuccess) onClose();
      }}
    >
      {savedSuccess ? (
        <WalletSavedConfirmation network={network} address={address} />
      ) : (
        <>
          <div className={styles.title}>Кошелек для вывода</div>
          <div className={styles.sub}>Введите адрес USDT TRC20 или TON кошелька</div>
          <div className={styles.networkRow}>
            {NETWORKS.map((item) => {
              const active = network === item;
              return (
                <button
                  key={item}
                  onClick={() => setNetwork(item)}
                  className={styles.networkBtn}
                  style={{
                    border: '1.5px solid ' + (active ? COLORS.accent : COLORS.div),
                    background: active ? COLORS.accent : COLORS.input,
                    color: active ? '#fff' : COLORS.text,
                    fontWeight: active ? 700 : 600,
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <TextInput
            value={address}
            onChange={(item) => setAddress(item.target.value)}
            placeholder={network === 'TON' ? 'UQ...' : 'TRX...'}
            style={{ marginBottom: 8, fontFamily: 'monospace', fontSize: 13 }}
          />
          <div className={styles.warn}>
            Убедитесь что адрес верный — средства не подлежат возврату
          </div>
          <PrimaryButton
            onClick={() => {
              hapticSuccess();
              setSavedSuccess(true);
            }}
            disabled={!address.trim()}
          >
            Сохранить
          </PrimaryButton>
          {address && (
            <button
              onClick={() => {
                setAddress('');
                onSaved('');
                onClose();
              }}
              className={styles.removeBtn}
            >
              Удалить кошелек
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}

export const WalletSheet = memo(WalletSheetImpl);
