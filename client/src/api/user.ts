/**
 * User profile & balance.
 *
 * `GET /users/profile` (JWT-guarded) returns the slim `ProfileDto`
 * defined in `server/src/modules/users/dto/profile.dto.ts`. The v143
 * client's `User` type carries a few extra fields (`name`, `played`,
 * `won`, `earned`) — we synthesise them from Telegram + zero stubs
 * until the server exposes game stats (Stage 4 candidate).
 */
import { MOCK_TRANSACTIONS, MOCK_USER } from '../data/mocks';
import { getTelegramUser } from '../services/telegram';
import type { Transaction, User } from '../types/domain';
import { httpRequest } from './client';

interface ServerProfile {
  id: string;
  telegramId: string;
  username: string | null;
  avatar: string | null;
  balance: number;
  walletAddress: string | null;
}

const apiConfigured = (): boolean => Boolean(import.meta.env?.VITE_API_BASE_URL);

const mapServerProfileToUser = (profile: ServerProfile): User => {
  const telegramUser = getTelegramUser();
  const firstName = telegramUser?.first_name ?? profile.username ?? 'Player';
  const initial = firstName.charAt(0).toUpperCase();
  const photo = telegramUser?.photo_url ?? profile.avatar ?? '';

  return {
    name: firstName,
    username: profile.username ? `@${profile.username}` : '',
    avatar: initial,
    photo,
    balance: profile.balance,
    // Server doesn't expose aggregate game stats yet — kept at 0 so the
    // profile screen still renders. Stage 4 will replace these with real
    // values from `/finances/history/all/:userId`.
    played: 0,
    won: 0,
    earned: 0,
  };
};

export const fetchCurrentUser = async (): Promise<User> => {
  if (!apiConfigured()) return MOCK_USER;

  const profile = await httpRequest<ServerProfile>('/users/profile');
  if (!profile) return MOCK_USER;
  return mapServerProfileToUser(profile);
};

/**
 * Transaction history. Stage 2 keeps this on mocks — the real wiring
 * lands in Stage 4 (Profile / history sheet) where the UI for it lives.
 */
export const fetchTransactions = async (): Promise<Transaction[]> => MOCK_TRANSACTIONS;

/** Internal helper exported for unit tests. */
export const __testing__ = { mapServerProfileToUser };
