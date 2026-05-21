import type { CSSProperties } from 'react';
import { memo } from 'react';

import { UsdtIcon } from '../../../components/icons/UsdtIcon';
import { BRAND, COLORS, RADIUS } from '../../../designSystem';
import css from '../Profile.module.css';

interface WithdrawWalletCardProps {
  walletAddress: string;
  onEdit: () => void;
}

/**
 * Section that previews the user's saved withdraw wallet and opens the
 * wallet sheet for editing. The actual sheet lives in `WalletSheet.jsx`.
 */
function WithdrawWalletCardImpl({ walletAddress, onEdit }: WithdrawWalletCardProps) {
  return (
    <div className={css.walletSection}>
      <div className={css.walletSectionLabel}>Кошелек для вывода</div>
      <div className={css.rowCard}>
        <UsdtIcon s={32} />
        <div style={{ flex: 1, minWidth: 0 } as CSSProperties}>
          <div style={{ fontSize: 15, fontWeight: 600 } as CSSProperties}>USDT TON</div>
          {walletAddress ? (
            <div className={css.walletAddressText}>{walletAddress}</div>
          ) : (
            <div className={css.walletPlaceholder}>Не добавлен</div>
          )}
        </div>
        <button
          onClick={onEdit}
          style={{
            background: walletAddress ? COLORS.div : COLORS.gold,
            color: walletAddress ? COLORS.text : BRAND.black,
            border: 'none',
            borderRadius: RADIUS.sm,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'inherit',
          } as CSSProperties}
        >
          {walletAddress ? 'Изменить' : 'Добавить'}
        </button>
      </div>
    </div>
  );
}

export const WithdrawWalletCard = memo(WithdrawWalletCardImpl);
