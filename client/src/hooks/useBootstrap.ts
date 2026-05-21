import { useEffect } from 'react';

import { connectSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { subscribeRoomSocket, useRoomStore } from '../store/roomStore';

/**
 * App bootstrap effect.
 *
 * Runs once on mount. The order matters:
 *   1. Subscribe the room store to the `rooms` socket event so we don't
 *      miss the initial push.
 *   2. Kick off Telegram login → JWT → `/users/profile`.
 *   3. Open the socket using the freshly minted JWT.
 *   4. Trigger an initial REST fetch of rooms so the lobby has data
 *      even if the socket connection fails / `VITE_SOCKET_URL` is unset.
 *
 * `connectSocket` and `subscribeRoomSocket` are no-ops when
 * `VITE_SOCKET_URL` is empty, so this hook is safe in dev preview.
 */
export const useBootstrap = (): void => {
  useEffect(() => {
    subscribeRoomSocket();

    const run = async (): Promise<void> => {
      await useAuthStore.getState().login();
      const token = useAuthStore.getState().token;
      connectSocket(token);
      await useRoomStore.getState().loadRooms();
    };

    void run();
  }, []);
};
