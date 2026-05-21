import type { CSSProperties } from 'react';
import { memo } from 'react';

import { MethodIcon } from '../../../components/icons/MethodIcon';
import { COLORS } from '../../../designSystem';
import type { Transaction } from '../../../types/domain';
import css from '../Profile.module.css';

export type TransactionFilter = 'all' | 'deposit' | 'withdraw';

const FILTERS = [
  ['all', 'Все'],
  ['deposit', 'Пополнения'],
  ['withdraw', 'Выводы'],
];

function ArrowIcon({ isDeposit }: { isDeposit: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isDeposit ? COLORS.green : COLORS.red}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isDeposit ? (
        <>
          <path d="M12 5 L12 19" />
          <polyline points="6 13 12 19 18 13" />
        </>
      ) : (
        <>
          <path d="M12 19 L12 5" />
          <polyline points="18 11 12 5 6 11" />
        </>
      )}
    </svg>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isDeposit = tx.type === 'deposit';
  const isPending = tx.status === 'pending';
  return (
    <div className={css.txRow}>
      <div
        className={css.txIcon}
        style={{
          background: isDeposit ? 'rgba(38,161,123,0.14)' : 'rgba(224,92,92,0.14)',
        } as CSSProperties}
      >
        <ArrowIcon isDeposit={isDeposit} />
      </div>
      <div className={css.txBody}>
        <div className={css.txAmountRow}>
          <span className={css.txAmount}>
            {isDeposit ? '+' : '−'}${tx.amount.toFixed(2)}
          </span>
          <span
            className={css.txBadge}
            style={{
              background: isPending ? 'rgba(245,166,35,0.15)' : 'rgba(38,161,123,0.15)',
              color: isPending ? COLORS.gold : COLORS.green,
            } as CSSProperties}
          >
            {isPending ? 'Pending' : 'Done'}
          </span>
        </div>
        <div className={css.txMeta}>
          {isDeposit ? 'Пополнение' : 'Вывод'} · {tx.method} · {tx.date}
        </div>
      </div>
      <div style={{ flexShrink: 0 } as CSSProperties}>
        <MethodIcon method={tx.method} s={26} />
      </div>
    </div>
  );
}

/**
 * Panel that opens below the "История депозитов" menu row.
 * Owns the type filter ("all" / "deposit" / "withdraw") and renders the
 * filtered transactions in a stacked list.
 */
interface HistoryPanelProps {
  transactions: Transaction[];
  filter: TransactionFilter;
  onFilterChange: (next: TransactionFilter) => void;
}

function HistoryPanelImpl({ transactions, filter, onFilterChange }: HistoryPanelProps) {
  const list =
    filter === 'all'
      ? transactions
      : transactions.filter((item: Transaction) => item.type === filter);
  return (
    <div className={css.historyPanel}>
      <div className={css.historyTabs}>
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={(event) => {
              event.stopPropagation();
              onFilterChange(key as TransactionFilter);
            }}
            className={
              filter === key ? `${css.historyTab} ${css.historyTabActive}` : css.historyTab
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div className={css.historyList}>
        {list.map((tx: Transaction) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
}

export const HistoryPanel = memo(HistoryPanelImpl);
