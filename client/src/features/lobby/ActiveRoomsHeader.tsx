import styles from './ActiveRoomsHeader.module.css';

export function ActiveRoomsHeader({ onlineCount }: { onlineCount: number }) {
  return (
    <div className={styles.row}>
      <div className={styles.title}>Активные комнаты</div>
      <div className={styles.status}>
        <div className={`online-dot ${styles.dot}`} />
        <span className={styles.online}>{onlineCount} онлайн</span>
      </div>
    </div>
  );
}
