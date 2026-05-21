import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { BalanceCard } from '../../components/BalanceCard';
import { MOCK_TELEGRAM_USER_ID as MOCK_TG_ID } from '../../constants/bets';
import { MOCK_TRANSACTIONS } from '../../data/mocks';
import { COLORS } from '../../designSystem';
import type { ThemeName, ThemePref } from '../../hooks/useTheme';
import { hapticTap } from '../../services/haptics';
import { getTelegramUserId } from '../../services/telegram';
import type { User } from '../../types/domain';
import type { TransactionFilter } from './components/HistoryPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { MenuItemRow } from './components/MenuItemRow';
import { LanguageRow, MyIdRow, ThemeRow } from './components/SettingsRows';
import { StatsTriplet } from './components/StatsTriplet';
import { WithdrawWalletCard } from './components/WithdrawWalletCard';
import {
  AgreementMenuIcon,
  HistoryMenuIcon,
  HowToPlayMenuIcon,
  NewsMenuIcon,
  PartnerMenuIcon,
  SupportMenuIcon,
} from './icons/MenuIcons';
import css from './Profile.module.css';
import { buildChevronUrl } from './profileData';
import { AgreementSheet } from './sheets/AgreementSheet';
import { PartnerSheet } from './sheets/PartnerSheet';
import { WalletSheet } from './sheets/WalletSheet';

const HISTORY_LABEL = 'История депозитов';

/**
 * Profile screen orchestrator.
 *
 * Owns three pieces of UI state that span multiple children:
 *   - `historyOpen`        — whether the deposit-history panel is expanded
 *   - which sheet is open  — wallet / partner / agreement
 *   - the saved wallet     — passed down to the wallet sheet
 *
 * Per-component concerns (network selection in WalletSheet, copied state in
 * PartnerSheet, the history filter, ID-copy toast) all live inside the
 * children themselves so re-renders stay scoped.
 */
interface ProfileScreenProps {
  user: User;
  onDeposit: () => void;
  onWithdraw: () => void;
  theme: ThemeName;
  themePref: ThemePref;
  onSetThemePref: (next: ThemePref) => void;
  onToggleTheme: () => void;
}

interface MenuItem {
  icon: ReactNode;
  bg: string;
  label: string;
  onClick: () => void;
}

export function ProfileScreen({
  user,
  onDeposit,
  onWithdraw,
  theme,
  themePref,
  onSetThemePref,
  onToggleTheme,
}: ProfileScreenProps) {
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [language, setLanguage] = useState('ru');
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);

  // Reset copied-flag toast after a short window so users see feedback
  // without it lingering forever.
  useEffect(() => {
    if (!idCopied) return undefined;
    const timer = setTimeout(() => setIdCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [idCopied]);

  // Prefer the real Telegram user id (when running inside Telegram). Falls
  // back to MOCK_TG_ID for display so the demo still renders something in
  // the browser preview — the referral link is hidden in that case to
  // avoid attributing every preview user to the same ID.
  const realTgUserId = getTelegramUserId();
  const displayedTgId = realTgUserId ?? MOCK_TG_ID;
  const referralLink = realTgUserId
    ? `https://t.me/MySvaraBot?startapp=${realTgUserId}`
    : null;

  const chevronUrl = useMemo(() => buildChevronUrl(theme), [theme]);

  const winRatePercent =
    user.played > 0 ? Math.round((user.won / user.played) * 100) : 0;

  const copyTelegramId = () => {
    try {
      navigator.clipboard?.writeText(String(displayedTgId));
    } catch {}
    hapticTap();
    setIdCopied(true);
  };

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        icon: <HistoryMenuIcon />,
        bg: COLORS.tintGreen,
        label: HISTORY_LABEL,
        onClick: () => setHistoryOpen((open) => !open),
      },
      {
        icon: <PartnerMenuIcon />,
        bg: COLORS.tintGold,
        label: 'Партнерская программа',
        onClick: () => setPartnerOpen(true),
      },
      {
        icon: <NewsMenuIcon />,
        bg: COLORS.tintRed,
        label: 'Новостной канал',
        onClick: () => {},
      },
      {
        icon: <AgreementMenuIcon />,
        bg: COLORS.tintPurple,
        label: 'Пользовательское соглашение',
        onClick: () => setAgreementOpen(true),
      },
      {
        icon: <HowToPlayMenuIcon />,
        bg: COLORS.tintGold,
        label: 'Как играть',
        onClick: () => {},
      },
      {
        icon: <SupportMenuIcon />,
        bg: COLORS.tintBlue,
        label: 'Чат с поддержкой',
        onClick: () => {},
      },
    ],
    [],
  );

  return (
    <div className={css.screen}>
      <BalanceCard user={user} onDeposit={onDeposit} onWithdraw={onWithdraw} />
      <StatsTriplet
        played={user.played}
        winRatePercent={winRatePercent}
        earned={user.earned}
      />
      <div className={css.menu}>
        {idCopied && <div className={css.toast}>✓ ID скопирован</div>}
        <MyIdRow id={displayedTgId} copied={idCopied} onCopy={copyTelegramId} />
        <LanguageRow value={language} onChange={setLanguage} chevronUrl={chevronUrl} />
        <ThemeRow
          theme={theme}
          themePref={themePref}
          onSetThemePref={onSetThemePref}
          onToggleTheme={onToggleTheme}
          chevronUrl={chevronUrl}
        />
        {menuItems.map((item) => (
          <div key={item.label}>
            <MenuItemRow
              icon={item.icon}
              bg={item.bg}
              label={item.label}
              expanded={item.label === HISTORY_LABEL && historyOpen}
              onClick={item.onClick}
            />
            {item.label === HISTORY_LABEL && historyOpen && (
              <HistoryPanel
                transactions={MOCK_TRANSACTIONS}
                filter={transactionFilter}
                onFilterChange={setTransactionFilter}
              />
            )}
          </div>
        ))}
        <WithdrawWalletCard
          walletAddress={walletAddress}
          onEdit={() => setWalletSheetOpen(true)}
        />
        {walletSheetOpen && (
          <WalletSheet
            initialAddress={walletAddress}
            onSaved={setWalletAddress}
            onClose={() => setWalletSheetOpen(false)}
          />
        )}
        {partnerOpen && (
          <PartnerSheet referralLink={referralLink} onClose={() => setPartnerOpen(false)} />
        )}
        {agreementOpen && <AgreementSheet onClose={() => setAgreementOpen(false)} />}
      </div>
    </div>
  );
}
