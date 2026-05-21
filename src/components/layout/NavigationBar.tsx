import type { ComponentType } from 'react';
import { memo, useCallback } from 'react';

import { COLORS, layout, zIndex } from '../../designSystem';
import { hapticTap } from '../../services/haptics';
import type { ScreenName } from '../../store/uiStore';
import { MODALS, SCREENS, useUiStore } from '../../store/uiStore';
import styles from './NavigationBar.module.css';
import {
  CreateActionIcon,
  LobbyIcon,
  type NavigationIconProps,
  ProfileIcon,
  RatingIcon,
  TournamentIcon,
} from './NavigationIcons';

interface NavTabConfig {
  id: ScreenName;
  label: string;
  Icon: ComponentType<NavigationIconProps>;
}

const SCREEN_TABS_LEFT: NavTabConfig[] = [
  { id: SCREENS.lobby, label: 'Лобби', Icon: LobbyIcon },
  { id: SCREENS.rating, label: 'Рейтинг', Icon: RatingIcon },
];

const SCREEN_TABS_RIGHT: NavTabConfig[] = [
  { id: SCREENS.tournament, label: 'Турниры', Icon: TournamentIcon },
  { id: SCREENS.profile, label: 'Профиль', Icon: ProfileIcon },
];

interface NavTabProps {
  tab: NavTabConfig;
  isActive: boolean;
  onSelect: (id: ScreenName) => void;
}

function NavTab({ tab, isActive, onSelect }: NavTabProps) {
  const color = isActive ? COLORS.accent : COLORS.hint;
  return (
    <button onClick={() => onSelect(tab.id)} className={styles.button}>
      <tab.Icon stroke={color} />
      <span
        className={`${styles.label} ${isActive ? styles.labelActive : ''}`}
        style={{ color }}
      >
        {tab.label}
      </span>
    </button>
  );
}

function NavigationBarImpl() {
  const activeScreen = useUiStore((state) => state.activeScreen);
  const setActiveScreen = useUiStore((state) => state.setActiveScreen);
  const openModal = useUiStore((state) => state.openModal);

  const handleTabSelect = useCallback(
    (screenId: ScreenName) => {
      hapticTap();
      setActiveScreen(screenId);
    },
    [setActiveScreen],
  );

  const handleCreateClick = useCallback(() => {
    hapticTap();
    openModal(MODALS.action);
  }, [openModal]);

  return (
    <div
      className={styles.bar}
      style={{ maxWidth: layout.appMaxWidth, zIndex: zIndex.bottomBar }}
    >
      {SCREEN_TABS_LEFT.map((tab) => (
        <NavTab
          key={tab.id}
          tab={tab}
          isActive={activeScreen === tab.id}
          onSelect={handleTabSelect}
        />
      ))}
      <button onClick={handleCreateClick} className={styles.button}>
        <CreateActionIcon stroke={COLORS.hint} />
        <span className={styles.label} style={{ color: COLORS.hint }}>
          Создать
        </span>
      </button>
      {SCREEN_TABS_RIGHT.map((tab) => (
        <NavTab
          key={tab.id}
          tab={tab}
          isActive={activeScreen === tab.id}
          onSelect={handleTabSelect}
        />
      ))}
    </div>
  );
}

export const NavigationBar = memo(NavigationBarImpl);
