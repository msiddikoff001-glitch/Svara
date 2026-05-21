import { create } from 'zustand';

import { fetchRooms } from '../api/rooms';
import { BET_LADDER } from '../constants/bets';
import { MOCK_ROOMS } from '../data/mocks';
import type { Room } from '../types/domain';

export type RoomMode = 'join' | 'watch';
export type SeatCountFilter = 'all' | 2 | 3 | 4 | 5 | 6;

export interface RoomFilters {
  search: string;
  onlyAvailable: boolean;
  betMinIndex: number;
  betMaxIndex: number;
  seatCount: SeatCountFilter;
}

const initialFilters: RoomFilters = {
  search: '',
  onlyAvailable: false,
  betMinIndex: 0,
  betMaxIndex: BET_LADDER.length - 1,
  seatCount: 'all',
};

export interface RoomStoreState {
  rooms: Room[];
  isLoadingRooms: boolean;
  error: unknown;
  filters: RoomFilters;
  selectedRoom: Room | null;
  selectedRoomMode: RoomMode | null;
  roomLoaderTarget: Room | null;
  roomLoaderCreating: boolean;
  needFundsRoom: Room | null;
  joinedTournamentIds: Set<number>;

  loadRooms: () => Promise<void>;
  clearError: () => void;
  setFilter: <K extends keyof RoomFilters>(key: K, value: RoomFilters[K]) => void;
  resetFilters: () => void;
  selectRoom: (room: Room | null, mode: RoomMode | null) => void;
  clearSelectedRoom: () => void;
  showRoomLoader: (room: Room | null, creating?: boolean) => void;
  hideRoomLoader: () => void;
  addRoom: (room: Room) => void;
  setNeedFundsRoom: (room: Room | null) => void;
  clearNeedFundsRoom: () => void;
  registerForTournament: (tournamentId: number) => void;
  isJoinedTournament: (tournamentId: number) => boolean;
}

/**
 * roomStore — list of rooms, filters, selected room, tournament registrations.
 */
export const useRoomStore = create<RoomStoreState>((set, get) => ({
  rooms: MOCK_ROOMS,
  isLoadingRooms: false,
  error: null,
  filters: initialFilters,
  selectedRoom: null,
  selectedRoomMode: null,
  roomLoaderTarget: null,
  roomLoaderCreating: false,
  needFundsRoom: null,
  joinedTournamentIds: new Set<number>(),

  loadRooms: async () => {
    set({ isLoadingRooms: true, error: null });
    try {
      const rooms = await fetchRooms();
      set({ rooms, isLoadingRooms: false });
    } catch (error) {
      set({ isLoadingRooms: false, error });
    }
  },

  clearError: () => set({ error: null }),

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: initialFilters }),

  selectRoom: (room, mode) => set({ selectedRoom: room, selectedRoomMode: mode }),
  clearSelectedRoom: () => set({ selectedRoom: null, selectedRoomMode: null }),

  showRoomLoader: (room, creating = false) =>
    set({ roomLoaderTarget: room, roomLoaderCreating: creating }),
  hideRoomLoader: () => set({ roomLoaderTarget: null, roomLoaderCreating: false }),

  addRoom: (room) => set((state) => ({ rooms: [room, ...state.rooms] })),

  setNeedFundsRoom: (room) => set({ needFundsRoom: room }),
  clearNeedFundsRoom: () => set({ needFundsRoom: null }),

  registerForTournament: (tournamentId) =>
    set((state) => {
      const next = new Set(state.joinedTournamentIds);
      next.add(tournamentId);
      return { joinedTournamentIds: next };
    }),

  isJoinedTournament: (tournamentId) => get().joinedTournamentIds.has(tournamentId),
}));
