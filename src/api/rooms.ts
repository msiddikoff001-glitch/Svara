/**
 * Rooms / lobby API.
 *
 * Mocked — swap for real endpoints when matchmaking is wired up. The shape
 * here matches what `roomStore` and `LobbyScreen` consume, so backend swap
 * should be straightforward.
 */
import { MOCK_ROOMS } from '../data/mocks';
import type { Room } from '../types/domain';

export const fetchRooms = async (): Promise<Room[]> => MOCK_ROOMS;

export const fetchRoomById = async (roomId: number | string): Promise<Room | null> =>
  MOCK_ROOMS.find((room) => room.id === roomId) ?? null;

export const joinRoomByCode = async (code: string | number): Promise<Room | null> =>
  MOCK_ROOMS.find((room) => String(room.num) === String(code)) ?? null;
