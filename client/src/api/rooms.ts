/**
 * Rooms / lobby API.
 *
 * `GET /rooms` returns the server's `Room` shape — a wider object than the
 * v143 client cares about (the client only renders ID / number / players /
 * capacity / bet). `mapServerRoomToClient` adapts the response so
 * `roomStore` and the UI keep their existing fields.
 *
 * Private rooms (`type === 'private'`) are filtered out from the lobby
 * list — they're joined via the "Join by code" modal and their password
 * shouldn't leak into the public list anyway.
 */
import { MOCK_ROOMS } from '../data/mocks';
import type { Room } from '../types/domain';
import { httpRequest } from './client';

interface ServerRoom {
  roomId: string;
  minBet: number;
  type: 'public' | 'private';
  players: string[];
  spectators?: string[];
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  password?: string;
  isSystem?: boolean;
}

const apiConfigured = (): boolean => Boolean(import.meta.env?.VITE_API_BASE_URL);

const mapServerRoomToClient = (room: ServerRoom): Room => {
  const num = Number.parseInt(room.roomId, 10);
  return {
    id: room.roomId,
    // Private rooms use the password as the ID, which may not be numeric;
    // fall back to 0 so the card still renders without crashing.
    num: Number.isFinite(num) ? num : 0,
    players: room.players.length,
    max: room.maxPlayers,
    bet: room.minBet,
  };
};

/**
 * Fetch the active room list.
 *
 * When `VITE_API_BASE_URL` is unset (local dev / preview without a
 * backend) the function falls back to `MOCK_ROOMS` so the UI keeps
 * something to render and visual smoke tests still pass.
 */
export const fetchRooms = async (): Promise<Room[]> => {
  if (!apiConfigured()) return MOCK_ROOMS;

  const data = await httpRequest<ServerRoom[]>('/rooms');
  if (!Array.isArray(data)) return [];

  return data
    .filter((room) => room.type === 'public' || room.isSystem)
    .map(mapServerRoomToClient);
};

/**
 * Look up a room by ID. Stage 2 keeps this on the mock list — proper
 * `/rooms/:id` resolution lands in Stage 6 alongside the
 * `RoomDetailsModal` rewrite. The lobby itself doesn't depend on it.
 */
export const fetchRoomById = async (roomId: number | string): Promise<Room | null> =>
  MOCK_ROOMS.find((room) => room.id === roomId || String(room.num) === String(roomId)) ?? null;

/**
 * Look up a (private) room by share code. Same staging note as
 * `fetchRoomById` — wired to the real `POST /rooms/:id/join` in Stage 6.
 */
export const joinRoomByCode = async (code: string | number): Promise<Room | null> =>
  MOCK_ROOMS.find((room) => String(room.num) === String(code)) ?? null;

/** Internal helper exported for unit tests. */
export const __testing__ = { mapServerRoomToClient };
