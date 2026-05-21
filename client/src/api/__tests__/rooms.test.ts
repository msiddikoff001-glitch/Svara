import { describe, expect, it } from 'vitest';

import { __testing__ } from '../rooms';

const { mapServerRoomToClient } = __testing__;

describe('mapServerRoomToClient', () => {
  it('maps a public room to the client shape', () => {
    const result = mapServerRoomToClient({
      roomId: '1337',
      minBet: 5,
      type: 'public',
      players: ['111', '222', '333'],
      status: 'waiting',
      maxPlayers: 6,
    });

    expect(result).toEqual({
      id: '1337',
      num: 1337,
      players: 3,
      max: 6,
      bet: 5,
    });
  });

  it('falls back to num=0 when roomId is non-numeric (private rooms use a password as id)', () => {
    const result = mapServerRoomToClient({
      roomId: 'secret-xyz',
      minBet: 10,
      type: 'private',
      players: [],
      status: 'waiting',
      maxPlayers: 4,
      password: 'secret-xyz',
    });

    expect(result.num).toBe(0);
    expect(result.id).toBe('secret-xyz');
  });

  it('treats players as a count, not an array, in the client shape', () => {
    const result = mapServerRoomToClient({
      roomId: '42',
      minBet: 1,
      type: 'public',
      players: [],
      status: 'waiting',
      maxPlayers: 6,
    });

    expect(result.players).toBe(0);
  });
});
