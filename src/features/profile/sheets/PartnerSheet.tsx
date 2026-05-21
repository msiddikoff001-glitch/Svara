import { memo, useState } from 'react';

import { Sheet } from '../../../components/ui/Sheet';
import { hapticTap } from '../../../services/haptics';
import { shareToTelegram } from '../../../services/telegram';
import { SheetCloseButton } from '../components/SheetCloseButton';
import type { AffiliateLevelRow } from '../profileData';
import { AFFILIATE_LEVELS, MOCK_USER_REFERRALS } from '../profileData';
import styles from './PartnerSheet.module.css';

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statBlock}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}

interface UserReferral {
  name: string;
  profit: number;
}

function LevelTable() {
  return (
    <div className={styles.levelBox}>
      <div className={styles.levelHead}>
        <div>Уровни</div>
        <div>Депозиты</div>
        <div className={styles.levelHeadRight}>%</div>
      </div>
      {AFFILIATE_LEVELS.map((row: AffiliateLevelRow, i: number) => (
        <div
          key={row[0]}
          className={`${styles.levelRow} ${i === 0 ? styles.first : ''}`}
        >
          <div>{row[0]}</div>
          <div className={styles.levelHint}>{row[1]}</div>
          <div className={styles.levelPercent}>{row[2]}</div>
        </div>
      ))}
    </div>
  );
}

function ReferralList() {
  return (
    <div className={styles.refList}>
      <div className={styles.refHead}>
        <div>Рефералы</div>
        <div>Профит</div>
      </div>
      {MOCK_USER_REFERRALS.length === 0 ? (
        <div className={styles.refEmpty}>Пока никого нет</div>
      ) : (
        MOCK_USER_REFERRALS.map((r: UserReferral, i: number) => (
          <div
            key={r.name + i}
            className={`${styles.refRow} ${i === 0 ? styles.first : ''}`}
          >
            <div>{r.name}</div>
            <div className={styles.refProfit}>${r.profit}</div>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * "Партнерская программа" sheet. Shows referral link, share buttons, the
 * level/% table and the user's current referrals. Copy state is local so
 * the parent doesn't have to know about it.
 */
interface PartnerSheetProps {
  referralLink: string | null;
  onClose: () => void;
}

function PartnerSheetImpl({ referralLink, onClose }: PartnerSheetProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (!referralLink) return;
    try {
      navigator.clipboard?.writeText(referralLink);
    } catch {
      // Best-effort; clipboard is unavailable in some embeds.
    }
    hapticTap();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = () => {
    if (!referralLink) return;
    hapticTap();
    shareToTelegram({
      url: referralLink,
      text: 'Присоединяйся к Svara — играй в Свару прямо в Telegram',
    });
  };

  return (
    <Sheet onClose={onClose}>
      <div className={`profileSheetClose ${styles.closeWrap}`}>
        <SheetCloseButton onClick={onClose} />
      </div>
      <div className={styles.title}>Партнерская программа</div>
      <div className={styles.statsRow}>
        <StatBlock label="Уровень" value="0%" />
        <StatBlock label="Заработок" value="$ 0.00" />
      </div>
      <div className={styles.linkLabel}>Твоя реферальная ссылка</div>
      <div className={styles.linkBox} style={{ color: 'var(--' + (referralLink ? 'text' : 'hint') + ')' }}>
        {referralLink ?? 'Откройте приложение в Telegram, чтобы получить реферальную ссылку'}
      </div>
      <div className={styles.actionsRow}>
        <button
          disabled={!referralLink}
          onClick={copyLink}
          className={`${styles.actionBtn} ${copied ? styles.copied : ''}`}
        >
          {copied ? '✓ Скопировано' : 'Скопировать'}
        </button>
        <button
          disabled={!referralLink}
          onClick={share}
          className={styles.actionBtn}
        >
          Поделиться
        </button>
      </div>
      <div className={styles.h1}>Зарабатывайте вместе с нами!</div>
      <div className={styles.descr}>
        Приглашайте рефералов и получайте процент с их депозитов в зависимости от количества
        привлечённых участников.
      </div>
      <div className={styles.h2}>Уровни</div>
      <LevelTable />
      <div className={styles.h3}>Условия</div>
      <ul className={styles.rules}>
        <li className={styles.rule}>· Реферал должен пополнить баланс от $100 и выше.</li>
        <li className={styles.rule}>
          · Процент начисляется с каждого депозита приглашённого реферала.
        </li>
        <li className={styles.rule}>
          · Чем больше ваших рефералов и их депозитов — тем выше ваш доход.
        </li>
        <li className={styles.rule}>
          · Начинайте приглашать и увеличивайте свой заработок уже сегодня!
        </li>
        <li>
          · Когда ваш накопительный баланс достигнет 10$, сумма автоматически переводится на
          игровой баланс.
        </li>
      </ul>
      <div className={styles.refsHead}>
        <div className={styles.refsTitle}>Твои рефералы</div>
        <div className={styles.refsBadge}>{MOCK_USER_REFERRALS.length}</div>
      </div>
      <ReferralList />
    </Sheet>
  );
}

export const PartnerSheet = memo(PartnerSheetImpl);
