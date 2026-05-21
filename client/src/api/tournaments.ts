import { MOCK_TOURNAMENT_LEADERBOARD,MOCK_TOURNAMENTS } from '../data/mocks';
import type { Tournament, TournamentLeaderboardEntry } from '../types/domain';

export const fetchTournaments = async (): Promise<Tournament[]> => MOCK_TOURNAMENTS;

export const fetchTournamentLeaderboard = async (): Promise<TournamentLeaderboardEntry[]> =>
  MOCK_TOURNAMENT_LEADERBOARD;

export const registerForTournament = async (_tournamentId: number): Promise<{ ok: true }> => ({
  ok: true,
});
