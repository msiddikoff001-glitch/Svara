import type { CSSProperties } from 'react';
import { memo } from 'react';

import { BRAND, COLORS } from '../../../designSystem';
import css from '../Profile.module.css';

interface StatsTripletProps {
  played: number;
  winRatePercent: number;
  earned: number;
}

type StatItem = readonly [value: string | number, label: string, color: string];

/**
 * 3-card row showing total games, win-rate and lifetime earnings.
 * Pure presentational — gets all data from the parent.
 */
function StatsTripletImpl({ played, winRatePercent, earned }: StatsTripletProps) {
  const items: StatItem[] = [
    [played, 'Игр', COLORS.gold],
    [winRatePercent + '%', 'Винрейт', COLORS.green],
    ['$' + earned, 'Выиграно', BRAND.usdt],
  ];
  return (
    <div className={css.statsRow}>
      {items.map((item) => (
        <div key={item[1]} className={css.statCard}>
          <div className={css.statValue} style={{ color: item[2] } as CSSProperties}>
            {item[0]}
          </div>
          <div className={css.statLabel}>{item[1]}</div>
        </div>
      ))}
    </div>
  );
}

export const StatsTriplet = memo(StatsTripletImpl);
