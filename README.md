# Свара — турниры (клон)

Полная 1:1 копия UI исходного референса, собранная как обычный React + Vite
проект.

## Запуск

```bash
npm install
npm run dev       # dev сервер на http://localhost:5173
npm run build     # production build в dist/
npm run preview
npm run lint      # ESLint (.js/.jsx + .ts/.tsx)
npm run typecheck # tsc --noEmit (TypeScript strict)
```

## TypeScript

Проект мигрирован на TypeScript (strict mode, `noImplicitAny: true`) incrementally — для нового слоя domain-логики (`store/`, `websocket/`, `api/`, `services/`, `shared/protocol/`, `gameRoom/constants|deck|sounds`, `designSystem/`, `constants/`, `data/mocks`, `types/domain`, `theme/`, `utils/format`) используется `.ts`. JSX-компоненты пока остаются `.jsx` и постепенно будут переведены в `.tsx`. `allowJs: true` в `tsconfig.json` обеспечивает безболезненное сосуществование `.js`/`.jsx` ↔ `.ts` модулей.

## Protocol & runtime validation

`src/shared/protocol/` — единый источник правды для всего, что ходит между клиентом и
сервером:

- `shared/` — общие схемы (`Card`, `Seat`, `Money`, `Timestamp`, `ProtocolError`).
- `server/` — server→client события: `ROOM_STATE`, `GAME_TICK`, `PLAYER_JOINED`,
  `PLAYER_LEFT`, `ROUND_RESULT`, `ERROR`. Тип `ServerToClientEvents` маппит
  имя события на payload.
- `client/` — client→server события: `AUTH`, `JOIN_ROOM`, `LEAVE_ROOM`, `PLACE_BET`,
  `CHAT_MESSAGE`. Тип `ClientToServerEvents`.
- `api/` — Zod-схемы REST-ответов (User, Room, Transaction, Tournament, ...).

Runtime-validation:

- `parseServerFrame(raw)` — валидирует входящий WS-frame через discriminatedUnion,
  возвращает `{ ok, frame } | { ok: false, error }`. `websocket/client.ts` вызывает его
  внутри обработчика `message`, malformed frame логируется и дропается.
- `validateApiResponse(schema, raw)` — то же для REST-ответов.
  `api/client.ts::httpRequestParsed(schema, path, opts)` — обёртка над `fetch`, бросает
  ошибку с детальными issues при несоответствии схеме.

Когда бекенд появится, добавление нового события сводится к 5 шагам:

1. Добавить имя в `shared/protocol/server/events.ts`.
2. Добавить payload schema в `shared/protocol/server/payloads.ts`.
3. Добавить ветку в `ServerFrameSchema` (`shared/protocol/server/frames.ts`).
4. Подписаться в `websocket/storeBridge.ts`, вызвав store action.
5. Добавить reducer в соответствующий slice.

## Структура

- `index.html` — корневая страница с темой и подключением Telegram WebApp.
- `src/main.jsx` — точка входа, монтирующая `App` через `createRoot`.
- `src/App.jsx` — приложение целиком (компоненты, экраны, моки данных,
  иконки/иллюстрации). Бэкенда нет, всё работает на in-memory state.

## Экраны

- **Лобби** — карточка пользователя с балансом, поиск/фильтр по комнатам,
  список активных столов с возможностью «Войти / Смотреть».
- **Рейтинг** — таблица лидеров.
- **Турниры** — список текущих и предстоящих турниров, экран турнира
  с таблицей и правилами, экран игры.
- **Профиль** — статистика, история транзакций, переключатель темы.
- Модалки **«Создать»**, **«Войти по коду»**, **«Пополнить»**, **«Вывести»**.

Тема (`dark` / `light`) переключается из профиля и сохраняется в
`localStorage` (ключ `svara_theme`).
