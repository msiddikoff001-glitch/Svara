import { useState } from 'react';

import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Sheet } from '../components/ui/Sheet';
import { TextInput } from '../components/ui/TextInput';
import { COLORS } from '../designSystem';
import { generateClientId } from '../utils/format';
import styles from './CreateRoomModal.module.css';

export interface CreateRoomPayload {
  id: string;
  num: number;
  players: number;
  max: number;
  bet: number;
  password?: string;
}

export interface CreateRoomModalProps {
  onClose: () => void;
  onBack: () => void;
  onCreate?: (room: CreateRoomPayload) => void;
}

export function CreateRoomModal({ onClose, onBack, onCreate }: CreateRoomModalProps) {
  const [bet, setBet] = useState('1');
  const [maxPlayers, setMaxPlayers] = useState('6');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  const handleCreate = () => {
    const betValue = Number(bet) || 1;
    const maxValue = Number(maxPlayers) || 6;
    const passwordValue = isPrivate ? password.trim() : undefined;
    onCreate?.({
      id: generateClientId(),
      num: Math.floor(100 + Math.random() * 900),
      players: 1,
      max: maxValue,
      bet: betValue,
      ...(passwordValue ? { password: passwordValue } : {}),
    });
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          {'Назад'}
        </button>
        <div className={styles.title}>{'Создать комнату'}</div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>{'Ставка (USDT)'}</div>
        <div className={styles.chipRow}>
          {['0.5', '1', '5', '10'].map((value) => (
            <button
              key={value}
              onClick={() => setBet(value)}
              className={`${styles.chip} ${bet === value ? styles.chipActive : ''}`}
            >
              {value}
              {'$'}
            </button>
          ))}
        </div>
        <TextInput
          value={bet}
          onChange={(value) => setBet(value.target.value)}
          placeholder="Или введите сумму"
          type="number"
        />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>{'Макс. игроков'}</div>
        <div className={styles.chipRowTight}>
          {['2', '3', '4', '5', '6'].map((value) => (
            <button
              key={value}
              onClick={() => setMaxPlayers(value)}
              className={`${styles.chipLg} ${maxPlayers === value ? styles.chipActive : ''}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`${styles.privateRow} ${
          isPrivate ? styles.privateRowExpanded : styles.privateRowCollapsed
        } ${isPrivate ? styles.privateRowOn : ''}`}
        onClick={() => setIsPrivate((value) => !value)}
      >
        <div
          className={`${styles.privateIconBox} ${isPrivate ? styles.privateIconBoxOn : ''}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isPrivate ? COLORS.accent : COLORS.hint}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className={styles.privateLabelWrap}>
          <div className={styles.privateLabel}>{'Закрытая комната'}</div>
          <div className={styles.privateHint}>{'Вход только по паролю'}</div>
        </div>
        <div className={`${styles.toggle} ${isPrivate ? styles.toggleOn : ''}`}>
          <div className={styles.toggleKnob} />
        </div>
      </div>
      {isPrivate && (
        <div className={styles.passwordWrap}>
          <TextInput
            value={password}
            onChange={(value) => setPassword(value.target.value)}
            placeholder="Придумайте пароль"
            type="number"
            className={password ? styles.passwordInputSpaced : undefined}
          />
        </div>
      )}
      <PrimaryButton onClick={handleCreate} disabled={isPrivate && !password.trim()}>
        {'Создать комнату'}
      </PrimaryButton>
    </Sheet>
  );
}
