import { useState } from 'react';

import { joinRoom } from '../api/rooms';
import { ErrorMsg } from '../components/ui/ErrorMsg';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Sheet } from '../components/ui/Sheet';
import { TextInput } from '../components/ui/TextInput';
import { COLORS, SPACING } from '../designSystem';
import styles from './RoomDetailsModal.module.css';

export interface RoomDetailsRoom {
  id: number | string;
  num: number;
  players: number;
  max: number;
  bet: number;
  password?: string;
}

export type RoomDetailsMode = 'join' | 'watch' | null;

export interface RoomDetailsModalProps {
  room: RoomDetailsRoom;
  mode: RoomDetailsMode;
  onClose: () => void;
  userBalance: number;
  onEnter?: () => void;
}

type RoomDetailsView = 'password' | 'info';

export function RoomDetailsModal({
  room,
  mode,
  onClose,
  userBalance,
  onEnter,
}: RoomDetailsModalProps) {
  const [view, setView] = useState<RoomDetailsView>(
    room.password && mode === 'join' ? 'password' : 'info',
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  function submitPassword() {
    if (passwordInput === room.password) {
      setView('info');
      setErrorMsg('');
    } else {
      setErrorMsg('Неверный пароль');
    }
  }

  async function handleEnter() {
    if (isJoining) return;
    // Spectator mode doesn't go through `/rooms/:id/join` — the watch
    // flow only subscribes to the game socket, so skipping the join
    // call keeps the UX snappier and avoids racking up empty joins on
    // crowded rooms.
    if (mode !== 'join') {
      (onEnter || onClose)();
      return;
    }
    setIsJoining(true);
    setErrorMsg('');
    try {
      // Best-effort — the server treats a re-join of an existing seat
      // as a no-op and we rely on the socket gateway for the real
      // game-state delivery. Surface failures so the user knows the
      // tap didn't go through instead of dumping them into a half-
      // joined room.
      await joinRoom(room.id);
      (onEnter || onClose)();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось войти в комнату';
      setErrorMsg(message);
    } finally {
      setIsJoining(false);
    }
  }

  const canAfford = userBalance >= room.bet;
  return (
    <Sheet onClose={onClose}>
      {view === 'password' && (
        <div>
          <div className={styles.pwHead}>
            <div className={styles.pwIconBox}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke={COLORS.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className={styles.pwTitle}>{'Закрытая комната'}</div>
            <div className={styles.pwSub}>
              {'Комната #'}
              {room.num}
              {' защищена паролем'}
            </div>
          </div>
          <TextInput
            value={passwordInput}
            onChange={(event) => {
              setPasswordInput(event.target.value);
              setErrorMsg('');
            }}
            placeholder="Введите пароль"
            type="number"
            style={{
              marginBottom: SPACING.lg,
              textAlign: 'center',
              letterSpacing: passwordInput ? 6 : 0,
              fontSize: 16,
              fontWeight: 700,
            }}
          />
          <ErrorMsg msg={errorMsg} />
          <PrimaryButton onClick={submitPassword} style={{ marginBottom: SPACING.lg }}>
            {'Войти'}
          </PrimaryButton>
          <PrimaryButton onClick={onClose} color={COLORS.div}>
            {'Отмена'}
          </PrimaryButton>
        </div>
      )}
      {view === 'info' && (
        <>
          <div className={styles.infoTitle}>
            {mode === 'join' ? 'Войти в комнату' : 'Смотреть комнату'}
          </div>
          <div className={styles.infoNum}>
            {'No. '}
            {room.num}
          </div>
          <div className={styles.infoCard}>
            {([
              ['Игроки', room.players + ' / ' + room.max],
              ['Ставка', '$' + room.bet + ' USDT'],
              ['Банк', '$' + (room.players * room.bet).toFixed(2) + ' USDT'],
            ] as const).map((row) => (
              <div key={row[0]} className={styles.infoRow}>
                <span className={styles.infoRowLabel}>{row[0]}</span>
                <span className={styles.infoRowValue}>{row[1]}</span>
              </div>
            ))}
          </div>
          {mode === 'join' ? (
            <div>
              <div className={styles.balLabel}>{'Ваш баланс'}</div>
              <div
                className={styles.balCard}
                style={{ color: canAfford ? COLORS.green : COLORS.red }}
              >
                {'$'}
                {userBalance.toFixed(2)}
                {' USDT'}
              </div>
              {!canAfford && (
                <div className={styles.balErr}>
                  {'Недостаточно средств. Нужно $'}
                  {room.bet}
                  {' USDT'}
                </div>
              )}
              <div className={styles.balSpacer} />
              <ErrorMsg msg={errorMsg} />
              <PrimaryButton
                onClick={() => {
                  void handleEnter();
                }}
                disabled={!canAfford || isJoining}
              >
                {isJoining ? 'Входим…' : `Войти (ставка $${room.bet} USDT)`}
              </PrimaryButton>
            </div>
          ) : (
            <div>
              <div className={styles.specCard}>
                {'Режим наблюдателя. Вы видите игру без участия в ставках.'}
              </div>
              <PrimaryButton
                onClick={() => {
                  void handleEnter();
                }}
                color="#2a3a4a"
              >
                {'Смотреть игру'}
              </PrimaryButton>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
