import { useState } from 'react';

import { createRoom } from '../api/rooms';
import { ErrorMsg } from '../components/ui/ErrorMsg';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Sheet } from '../components/ui/Sheet';
import { TextInput } from '../components/ui/TextInput';
import { COLORS } from '../designSystem';
import type { Room } from '../types/domain';
import styles from './CreateRoomModal.module.css';

export type CreateRoomPayload = Room;

export interface CreateRoomModalProps {
  onClose: () => void;
  onBack: () => void;
  onCreate?: (room: CreateRoomPayload) => void;
}

/**
 * Server rule for private rooms: the password is also the room id, so
 * it has to be exactly six digits (see `CreateRoomDto`). We mirror that
 * here client-side so the user gets immediate feedback instead of a
 * 400 from the API.
 */
const PRIVATE_PASSWORD_PATTERN = /^\d{6}$/;

export function CreateRoomModal({ onClose, onBack, onCreate }: CreateRoomModalProps) {
  const [bet, setBet] = useState('1');
  const [maxPlayers, setMaxPlayers] = useState('6');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (isSubmitting) return;
    const betValue = Number(bet) || 1;
    if (betValue < 1) {
      setErrorMsg('Минимальная ставка — $1');
      return;
    }
    if (isPrivate && !PRIVATE_PASSWORD_PATTERN.test(password.trim())) {
      setErrorMsg('Пароль должен состоять из 6 цифр');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const room = await createRoom({
        minBet: betValue,
        type: isPrivate ? 'private' : 'public',
        password: isPrivate ? password.trim() : undefined,
      });
      // `maxPlayers` is a v143-only knob — the backend always allocates
      // 6 seats. We keep the user's choice as a presentation cap so the
      // lobby card matches their intent.
      const cap = Number(maxPlayers) || 6;
      onCreate?.({ ...room, max: Math.min(room.max, cap) });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось создать комнату';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
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
          <div className={styles.privateHint}>{'Вход только по паролю (6 цифр)'}</div>
        </div>
        <div className={`${styles.toggle} ${isPrivate ? styles.toggleOn : ''}`}>
          <div className={styles.toggleKnob} />
        </div>
      </div>
      {isPrivate && (
        <div className={styles.passwordWrap}>
          <TextInput
            value={password}
            onChange={(value) =>
              setPassword(value.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder="Пароль (6 цифр)"
            type="number"
            className={password ? styles.passwordInputSpaced : undefined}
          />
        </div>
      )}
      <ErrorMsg msg={errorMsg} />
      <PrimaryButton
        onClick={() => {
          void handleCreate();
        }}
        disabled={
          isSubmitting || (isPrivate && !PRIVATE_PASSWORD_PATTERN.test(password.trim()))
        }
      >
        {isSubmitting ? 'Создаём…' : 'Создать комнату'}
      </PrimaryButton>
    </Sheet>
  );
}
