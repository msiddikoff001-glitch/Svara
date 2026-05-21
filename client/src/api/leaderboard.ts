import { MOCK_LEADERBOARD } from '../data/mocks';
import type { LeaderboardEntry } from '../types/domain';

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => MOCK_LEADERBOARD;
