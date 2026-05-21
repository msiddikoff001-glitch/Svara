import { useState } from 'react';

import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Sheet } from '../components/ui/Sheet';
import { TextInput } from '../components/ui/TextInput';
import styles from './JoinByCodeModal.module.css';

export interface JoinByCodeModalProps {
  onClose: () => void;
  onBack: () => void;
}

export function JoinByCodeModal({ onClose, onBack }: JoinByCodeModalProps) {
  const [roomCode, setRoomCode] = useState('');
  return (
    <Sheet onClose={onClose}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          {'Назад'}
        </button>
        <div className={styles.title}>{'Войти по коду'}</div>
      </div>
      <div className={styles.hint}>{'Введите код комнаты от друга'}</div>
      <TextInput
        value={roomCode}
        onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
        placeholder="ABC123"
        style={{
          marginBottom: 14,
          textAlign: 'center',
          letterSpacing: 4,
          fontWeight: 700,
        }}
      />
      <PrimaryButton onClick={onClose} disabled={!roomCode.trim()}>
        {'Войти в комнату'}
      </PrimaryButton>
    </Sheet>
  );
}
