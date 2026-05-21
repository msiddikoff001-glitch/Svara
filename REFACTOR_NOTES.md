# Svara — Отчёт по рефакторингу

Полный refactor проекта без изменения внешнего вида UI. Все основные
функциональные потоки протестированы вручную в браузере (lobby, room details
modal, tournaments, profile).

## Что изменено

### 1. `App.jsx`: 712 → 91 строк

Был один большой файл с 13 `useState`, обфусцированными переменными
(`c, m, S, k, T, P, x, R, _, L, E, X, A, W, B, I, re, D, de, ie, me, Le, oe, De`),
тремя крупными `useEffect` (тема, Telegram chrome, BackButton), inline-рендером
nav-bar, splash-loader-а, sheet'а "недостаточно средств", и тяжелым `style={{...}}`
блоком на ~80 строк глобального CSS.

Стал тонким shell-ом, который только:
- инициализирует Telegram через `useTelegram()`
- держит preference темы через `useTheme()`
- подключает BackButton через `useBackButton()`
- скроллит вверх при смене экрана через `useScrollToTopOn()`
- рендерит `<RootLayout>`, `<ScreenRouter>`, `<NavigationBar>`, `<ModalsManager>`, `<GameRoomHost>`

### 2. Hooks — `src/hooks/`

- **`useTelegram()`** — инициализация WebApp shell (`ready`, `expand`,
  `exitFullscreen`, `disableVerticalSwipes`, `enableClosingConfirmation`).
- **`useTheme()`** — preference (`dark | light | system`), persist в localStorage,
  слушает `prefers-color-scheme` и `themeChanged` из Telegram, применяет CSS
  variables, theme-color meta, Telegram header/background/bottom-bar colors.
- **`useBackButton(visible, onBack)`** — показ/скрытие Telegram BackButton.
- **`useRooms()`** — выдаёт `rooms`, `filteredRooms`, `filters`, `activeFilterCount`
  на основе фильтров в `roomStore`. Мемоизация через `useMemo`.
- **`useScrollToTopOn(deps)`** — скролл наверх при смене экранов/вкладок.

### 3. Zustand stores — `src/store/`

Состояние больше не разнесено по 13 `useState` в `App.jsx`. Четыре чистых
стора:

- **`authStore`** — `user`, `isLoading`, `loadUser()`, `creditBalance(delta)`,
  `debitBalance(delta)`.
- **`uiStore`** — `activeScreen`, `activeModal`, `activeTournament`,
  `tournamentTab`, `isSplashVisible` + actions. Экспортирует константы
  `SCREENS`, `MODALS`, `TOURNAMENT_TABS`.
- **`roomStore`** — `rooms`, `filters` (`search`, `onlyAvailable`,
  `betMinIndex`, `betMaxIndex`, `seatCount`), `selectedRoom`,
  `selectedRoomMode`, `roomLoaderTarget`, `needFundsRoom`,
  `joinedTournamentIds`, и actions для каждой операции.
- **`gameStore`** — `activeRoom`, `mode` (`join | watch`) +
  `enterRoom(room, mode)`, `exitRoom()`. Изолирует тяжёлый GameRoom от
  остального UI.

### 4. Services — `src/services/`

- **`telegram.js`** — единственная точка контакта с `window.Telegram.WebApp`.
  Все `try/catch` живут тут, компоненты остаются чистыми.
- **`haptics.js`** — `hapticTap()`, `hapticSuccess()` с фолбэком на
  `navigator.vibrate` (Android Telegram часто игнорирует HapticFeedback).
- **`sound.js`** — `playSound('success' | 'tap')`.

Старые `utils/theme.js`, `utils/haptics.js`, `utils/sound.js` оставлены
как re-export shims, чтобы не ломать импорты в существующих компонентах.

### 5. API — `src/api/`

Готовый scaffolding под backend:

- `client.js` — `httpRequest(path, options)` с авто-инжектом
  `X-Telegram-Init-Data`. Использует `VITE_API_BASE_URL` из `.env`.
- `user.js`, `rooms.js`, `tournaments.js`, `payments.js`, `leaderboard.js` —
  пока возвращают моки. Когда появится backend, тело каждой функции
  заменяется на `httpRequest(...)`.

### 6. WebSocket — `src/websocket/`

- `events.js` — типизированный каталог имён событий (`WS_EVENTS.JOIN_ROOM`,
  `WS_EVENTS.GAME_TICK`, и т. д.).
- `client.js` — `WebSocketClient` с:
  - буферизацией исходящих сообщений до connect,
  - exponential backoff reconnect,
  - типизированной подпиской `on(event, handler)`.
- Сейчас работает в "offline" режиме (без backend). Подключение
  активируется автоматически при `VITE_WS_URL`.

### 7. Design tokens — `src/constants/` и `src/theme/`

- `constants/design.js` — `spacing`, `radii`, `shadows`, `zIndex`, `typography`,
  `layout`, `motion`.
- `constants/app.js` — `STORAGE_KEYS`, `TELEGRAM_THEMES`, `ROOM_LOADER_DELAY_MS`.
- `constants/bets.js` — `BET_LADDER`, `BET_LABELS`.
- `theme/palette.js` — все CSS variables, brand colors, `themeBackground()`.
- `theme/systemTheme.js` — `detectSystemTheme()` (Telegram → matchMedia →
  default dark).

### 8. Layout components — `src/components/layout/`

- `RootLayout` — централизованный mobile-width container + `<GlobalStyles>`.
- `GlobalStyles` — все keyframes и input-resets в одном месте.
- `NavigationBar` — bottom nav (Лобби, Рейтинг, Создать, Турниры, Профиль).
  Мемоизирован, читает прямо из `uiStore`.
- `NavigationIcons` — иконки нав-таба вынесены отдельно.
- `GameRoomHost` — `Suspense` + lazy `GameRoom`, читает `gameStore` и
  `roomStore.roomLoaderTarget`. Изолирует тяжёлый bundle.

### 9. Modals — `src/components/modals/`

- `ModalsManager` — центральная точка управления всеми модалками
  (`StartGameSheet`, `DepositModal`, `WithdrawModal`, `CreateRoomModal`,
  `JoinByCodeModal`, `RoomDetailsModal`, `InsufficientFundsModal`).
  Содержит логику `selectedRoom → roomLoader → enterRoom` через
  `gameStore.enterRoom()`.
- `InsufficientFundsModal` — извлечён из 110-строкового inline-блока в App.jsx
  в чистый компонент.

### 10. LobbyScreen — 556 → 100 строк (с разбивкой на 4 sub-components)

- `screens/LobbyScreen.jsx` (100 строк) — оркестратор.
- `screens/lobby/LobbyFilterBar.jsx` — search + toggle "Доступны" + filter button.
- `screens/lobby/ActiveRoomsHeader.jsx` — header с онлайн-счётчиком.
- `screens/lobby/RoomCard.jsx` — одна строка комнаты, мемоизирован.
- `screens/lobby/LobbyFilterSheet.jsx` — bottom-sheet фильтра.

Все короткие имена (`S, k, T, P, _, L, x, R, B, X, A, W, re, oe, D, de, ie,
me, Le`) → читаемые: `searchValue`, `onlyAvailable`, `filteredRooms`,
`activeFilterCount`, `isFilterSheetOpen`, `betMinIndex`, `betMaxIndex`,
`seatCount` и т. д.

Фильтры теперь в `roomStore` — состояние переживает смены экранов и доступно
для любого компонента.

### 11. ScreenRouter

`screens/ScreenRouter.jsx` — `switch`-подобная маршрутизация. Решает что
рендерить на основе `uiStore.activeScreen` и `uiStore.activeTournament`.
App.jsx больше не содержит логики маршрутизации.

### 12. Memoization

Применён `React.memo` к чистым презентационным компонентам:
- `BalanceCard`
- `TournamentCard`
- `NavigationBar`
- `LobbyFilterBar`
- `RoomCard`

`useMemo` использован для `filteredRooms`, `onlineCount`, `activeFilterCount`,
`activeCount` (в TournamentsListScreen).

`useCallback` — для всех handler-ов, передаваемых в memo-компоненты.

### 13. Переименования (короткие → описательные)

| Было | Стало |
|------|-------|
| `c, m` (App) | `activeScreen, setActiveScreen` (в `uiStore`) |
| `u, E` (App) | `activeModal, openModal/closeModal` (в `uiStore`) |
| `S, k` (App) | `selectedRoom, selectRoom` (в `roomStore`) |
| `T, P` (App) | `selectedRoomMode` (в `roomStore`) |
| `_, L` (App) | `user, creditBalance/debitBalance` (в `authStore`) |
| `x, R` (App) | `activeTournament, setActiveTournament` (в `uiStore`) |
| `B, X` (App) | `tournamentTab, setTournamentTab` (в `uiStore`) |
| `A, W` (App) | `joinedTournamentIds, registerForTournament` |
| `I, re` (App) | `activeTheme` (в `useTheme`) |
| `S, k` (Lobby) | `searchValue, setSearchValue` |
| `T, P` (Lobby) | `onlyAvailable, toggleOnlyAvailable` |
| `_, L` (Lobby) | `isFilterSheetOpen, setIsFilterSheetOpen` |
| `x, R` / `B, X` (Lobby) | `betMinIndex, betMaxIndex` |
| `A, W` (Lobby) | `seatCount` |
| `oe` (Lobby) | `filteredRooms` |
| `E, S` (BalanceCard) | `wholePart, decimalPart` |
| `k, T, P, _, L` (TournamentCard) | `dateRange, isFull, isSuccessSheetOpen, setIsSuccessSheetOpen, handleRegister` |
| `u, E` (JoinByCodeModal) | `roomCode, setRoomCode` |

### 14. GameRoom.jsx (2190 строк)

GameRoom внутри уже разделён на ~30 локальных компонентов с нормальными
именами (`CardBack`, `CardPair`, `SeatCard`, `CenterDeck`, `Avatar`,
`NamePlate`, `DealerChip`, `ReactionBubble`, `Seat`, `Chip`, `Die`,
`DiceTrio`, `ConfirmExit`, `GameMenu`, `Header`, `SpectatorBar`,
`ActionButtons`, `ChatButton`, `LottieEmoji`, `PhraseBubbleButton`,
`ChatPanel`, `ActiveBetChip`, ...). Отдельных файлов не делал, чтобы не
ломать lazy-chunk и не размазывать тесно связанную игровую логику. Через
`gameStore` это уже изолировано от остального приложения и грузится
по требованию (`React.lazy`).

## Новая структура

```
src/
├── api/
│   ├── client.js          ← fetch wrapper с Telegram initData
│   ├── leaderboard.js
│   ├── payments.js        ← createDeposit / createWithdrawal / methods
│   ├── rooms.js           ← fetchRooms / fetchRoomById / joinByCode
│   ├── tournaments.js
│   ├── user.js
│   └── index.js
│
├── components/
│   ├── icons/             ← (без изменений)
│   ├── layout/            ← новое
│   │   ├── GameRoomHost.jsx
│   │   ├── GlobalStyles.jsx
│   │   ├── NavigationBar.jsx
│   │   ├── NavigationIcons.jsx
│   │   └── RootLayout.jsx
│   ├── modals/            ← новое
│   │   ├── InsufficientFundsModal.jsx
│   │   └── ModalsManager.jsx
│   ├── ui/                ← (без изменений)
│   ├── BalanceCard.jsx    ← memo + renamed
│   ├── ConnectionStatus.jsx
│   ├── RoomLoader.jsx
│   ├── SplashScreen.jsx
│   └── TournamentCard.jsx ← memo + renamed
│
├── constants/             ← новое
│   ├── app.js             ← STORAGE_KEYS, TELEGRAM_THEMES
│   ├── bets.js            ← BET_LADDER, BET_LABELS
│   ├── design.js          ← spacing, radii, shadows, zIndex, typography
│   └── index.js
│
├── data/
│   ├── constants.js       ← re-export shim
│   └── mocks.js
│
├── hooks/                 ← новое
│   ├── useBackButton.js
│   ├── useRooms.js
│   ├── useScrollToTopOn.js
│   ├── useTelegram.js
│   ├── useTheme.js
│   └── index.js
│
├── modals/                ← (бизнес-модалки, без изменений кроме JoinByCode)
│   ├── CreateRoomModal.jsx
│   ├── DepositModal.jsx
│   ├── JoinByCodeModal.jsx ← renamed
│   ├── RoomDetailsModal.jsx
│   ├── StartGameSheet.jsx
│   └── WithdrawModal.jsx
│
├── screens/
│   ├── lobby/             ← новое (декомпозиция LobbyScreen)
│   │   ├── ActiveRoomsHeader.jsx
│   │   ├── LobbyFilterBar.jsx
│   │   ├── LobbyFilterSheet.jsx
│   │   └── RoomCard.jsx
│   ├── LobbyScreen.jsx    ← 556 → 100 строк
│   ├── ProfileScreen.jsx
│   ├── RatingScreen.jsx
│   ├── ScreenRouter.jsx   ← новое
│   ├── TournamentDetailsScreen.jsx
│   ├── TournamentGameScreen.jsx
│   └── TournamentsListScreen.jsx ← извлечено из App.jsx
│
├── services/              ← новое
│   ├── haptics.js
│   ├── sound.js
│   ├── telegram.js        ← все try/catch вокруг WebApp здесь
│   └── index.js
│
├── store/                 ← новое (Zustand)
│   ├── authStore.js
│   ├── gameStore.js
│   ├── roomStore.js
│   ├── uiStore.js
│   └── index.js
│
├── theme/                 ← новое
│   ├── palette.js
│   ├── systemTheme.js
│   └── index.js
│
├── utils/                 ← shims к services/theme
│   ├── format.js
│   ├── haptics.js
│   ├── sound.js
│   └── theme.js
│
├── websocket/             ← новое
│   ├── client.js
│   ├── events.js
│   └── index.js
│
├── App.jsx                ← 712 → 91 строк
├── GameRoom.jsx           ← prettier-only
└── main.jsx
```

## Что стало лучше

1. **Читаемость.** App.jsx — 91 строка, видно за минуту что он делает.
   Любой `xxxScreen` теперь декомпозирован на тематические подкомпоненты
   и читается за один проход.
2. **Тестируемость.** Сервисы (`services/telegram.js`) и stores легко
   мокаются. Hooks (`useRooms`, `useTheme`) тестируются изолированно.
3. **Масштабируемость.** Добавить новый экран — 1 строка в `ScreenRouter`.
   Добавить модалку — 1 ветка в `ModalsManager`. Добавить новый API
   endpoint — 1 функция в `api/`. Добавить WS-событие — 1 строка в
   `websocket/events.js`.
4. **Готовность к backend.** `api/client.js` + `websocket/client.js`
   ждут только `VITE_API_BASE_URL` и `VITE_WS_URL`. Каждый mock-endpoint
   меняется одной строкой на `httpRequest(...)`. Контракт не меняется.
5. **Производительность.** Memoization на горячих компонентах (RoomCard,
   TournamentCard, NavigationBar, BalanceCard). Селекторы Zustand
   автоматически избегают ререндеров — компонент перерисуется только
   когда _его слайс_ стора изменился.
6. **Безопасность типизации в будущем.** Все имена через константы
   (`SCREENS`, `MODALS`, `TOURNAMENT_TABS`, `GAME_MODES`, `WS_EVENTS`) —
   перевод на TypeScript станет почти автоматическим.
7. **UI не сломан.** Внешне приложение выглядит и работает идентично
   (проверено вручную: splash → lobby → room details → tournaments →
   profile).

## Известные нерешённые задачи

- **Inline-стили в больших экранах.** В `ProfileScreen`, `DepositModal`,
  `WithdrawModal`, `TournamentDetailsScreen`, `TournamentGameScreen`,
  `GameRoom` остались inline-стили. Извлечение их в CSS modules — отдельный
  большой проход (несколько тысяч строк CSS). Дизайн-токены готовы и могут
  использоваться оттуда.
- **Полное переименование в больших экранах.** `ProfileScreen` (1507 строк),
  `DepositModal` (830 строк), `WithdrawModal` (551 строк) пока сохраняют
  оригинальный код с минификацией. Они изолированы и не блокируют
  архитектуру — рекомендую отдельную итерацию.
- **TypeScript.** Архитектура подготовлена, но миграция — отдельный проект.

## Запуск

Без изменений:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Подключение backend

1. Создать `.env`:
   ```
   VITE_API_BASE_URL=https://api.svara.app/v1
   VITE_WS_URL=wss://ws.svara.app/v1
   ```
2. В каждом файле `src/api/*.js` заменить тело функции с моков на
   `return httpRequest('/path', { method: 'POST', body })`.
3. В стартапе приложения (можно прямо в `main.jsx` после `createRoot`):
   ```js
   import { wsClient, WS_EVENTS } from './websocket';
   wsClient.connect();
   wsClient.on(WS_EVENTS.ROOM_STATE, (payload) => { /* ... */ });
   ```
4. В `authStore.loadUser` поменять `MOCK_USER` на ответ
   `fetchCurrentUser()`. Сделать `useEffect(() => { loadUser(); }, [])`
   в App.jsx.

---

# v35 — Доработка (этот заход)

Цель захода: закрыть "Известные нерешённые задачи" v34 — декомпозиция
трёх крупных компонентов (`DepositModal`, `ProfileScreen`, `GameRoom`),
извлечение inline-стилей в CSS Modules, lazy-loading модалок,
safe-area-inset-bottom на фиксированных элементах, разделение
design-system на per-file токены.

## 1. Design System: per-file токены — `src/designSystem/`

Раньше всё лежало в одном `constants/design.js`. Стало:

```
src/designSystem/
├── colors.js       ← SURFACE / TEXT / TINTS / BRAND / themeBackground
├── spacing.js      ← spacing.{xs,sm,md,lg,xl,xxl}
├── radius.js       ← radii.{sm,md,lg,xl,pill}
├── shadows.js      ← shadows.{soft,card,modal}
├── typography.js   ← typography.{size,weight,lineHeight}
├── zIndex.js       ← zIndex.{base,bottomBar,modal,toast,overlay}
├── layout.js       ← layout.appMaxWidth + responsive breakpoints
├── motion.js       ← motion.{duration,easing}
└── index.js        ← re-export всех модулей
```

Старые `src/constants/design.js` и `src/theme/palette.js` оставлены
как shims, которые re-export'ят из `src/designSystem/*`. Существующие
импорты не сломаны.

## 2. WebSocket → Store bridge — `src/websocket/storeBridge.js` + `src/store/gameStore.js`

`gameStore` расширен production-слайсами под realtime multiplayer:

```js
{
  // existing
  activeRoom, mode, enterRoom(), exitRoom(),

  // new — game state slice
  gameState: { phase, pot, deck, communityCards, currentBet, dealerSeatIndex },
  players: [{ seatIndex, userId, name, balance, cards, isFolded, isAllIn }],
  setGameState(partial),
  setPlayers(players),

  // new — server sync helpers
  onServerEvent(eventName, payload),
  applyServerSnapshot(snapshot),
}
```

`src/websocket/storeBridge.js` — чистый pure-function слой, который
маппит входящие WS-события на store-методы. Сам по себе store-bridge
не запускает соединение (это контролируется на старте приложения);
он только описывает контракт. Тестируется как pure mapping.

При появлении backend:
```js
import { wsClient, WS_EVENTS } from './websocket';
import { wireGameStoreBridge } from './websocket/storeBridge';
wireGameStoreBridge(wsClient);
wsClient.connect();
```

## 3. DepositModal: 866 → 91 строк + step-машина

```
src/modals/deposit/
├── DepositModal.jsx               ← orchestrator (91 строка)
├── DepositSheet.module.css        ← все .module-стили листа
├── DepositSuccessOverlay.jsx      ← + DepositSuccessOverlay.module.css
├── useDepositFlow.js              ← state machine (idle → selected → amount → crypto/card → success)
├── steps/
│   ├── SelectMethodStep.jsx
│   ├── EnterAmountStep.jsx
│   ├── CryptoPaymentStep.jsx
│   └── CardPaymentStep.jsx
└── components/
    ├── MethodHeader.jsx
    ├── WarningRow.jsx
    ├── CopyRow.jsx                ← + CopyRow.module.css
    └── CopyToast.jsx
```

Все step- и component-файлы обёрнуты в `React.memo`.

## 4. ProfileScreen: 1476 → 174 строки + 9 sub-компонентов

```
src/screens/profile/
├── ProfileScreen.jsx              ← orchestrator (174 строки)
├── Profile.module.css             ← scoped CSS (60+ правил)
├── profileData.js                 ← MOCK_TRANSACTIONS, AGREEMENT_SECTIONS,
│                                    AFFILIATE_LEVELS, buildChevronUrl()
├── icons/MenuIcons.jsx            ← 6 SVG: History/Partner/News/Agreement/HowTo/Support
├── components/
│   ├── SheetCloseButton.jsx       ← memo
│   ├── StatsTriplet.jsx           ← memo (Игр / Винрейт / Выиграно)
│   ├── SettingsRows.jsx           ← memo: MyIdRow, LanguageRow, ThemeRow
│   ├── MenuItemRow.jsx            ← memo
│   ├── HistoryPanel.jsx           ← memo (фильтр-табы + TransactionRow)
│   └── WithdrawWalletCard.jsx     ← memo
└── sheets/
    ├── WalletSheet.jsx            ← memo (USDT TRC20 / TON, с success-анимацией)
    ├── PartnerSheet.jsx           ← memo (реф-ссылка + копировать/поделиться + тарифы)
    └── AgreementSheet.jsx         ← memo (рендерит AGREEMENT_SECTIONS)
```

Старый `src/screens/ProfileScreen.jsx` оставлен как shim
(`export { ProfileScreen } from './profile/ProfileScreen'`).

## 5. GameRoom: 820 → 288 строк + 4 компонента + 5 хуков

Старый монолит разбит на:

```
src/
├── GameRoom.jsx                            ← orchestrator (288 строк)
└── gameRoom/
    ├── components/                         ← раньше тут уже были seats / cards / etc.
    │   ├── Table.jsx           (новое)     ← овальный фетл + rail + текстуры + watermark
    │   ├── PotView.jsx         (новое)     ← центральный readout банка + waiting pill
    │   ├── SeatsLayer.jsx      (новое)     ← memo'd список Seat
    │   └── GameRoomKeyframes.jsx (новое)   ← global @keyframes для деал-анимаций
    └── hooks/                              (всё новое)
        ├── useSeatRotation.js              ← state-machine: spectator → chosenPos → rotation
        ├── useChatReactions.js             ← per-seat реакции + shared WebAudio context
        ├── useGameSettings.js              ← persistent felt/sound/vibration (localStorage)
        ├── useTgBackButton.js              ← Telegram BackButton + ConfirmExit
        └── useBodyScrollLock.js            ← document scroll lock с восстановлением
```

`GameRoom.jsx` теперь просто:
1. Соединяет хуки.
2. Решает кому показывать рассадочный пикер, кому пот.
3. Рендерит Table / SeatsLayer / PotView / Chat / Settings / ActionButtons.

Tabular-стиль ушёл в `Table.jsx` (felt visuals), `PotView.jsx` (banker
readout), `SeatsLayer.jsx` (memoised seat list).

## 6. CSS Modules вместо inline-стилей

- **DepositSheet.module.css** — header / methods / amount / crypto / card.
- **DepositSuccessOverlay.module.css** — + локально объявленные `@keyframes`
  (`dep_pop`, `dep_check`, `dep_ring`).
- **CopyRow.module.css** — copy-row + toast.
- **Profile.module.css** — statsRow / rowCard / menuRow / historyTab /
  txRow / toast и т. д. (60+ правил).
- **WalletSheet.module.css** — локальные `@keyframes` для success-анимации
  (`wal_pop`, `wal_check`, `wal_ring`, `wal_pulse`).
- **PartnerSheet.module.css** — referral card / link row / tiers grid.

Важный технический момент: при `postcss-modules` все `@keyframes`,
которые используются _изнутри CSS Module_, должны быть **локально
переобъявлены в том же файле**. Глобальные keyframes из
`GlobalStyles.jsx` остаются для inline-стилей в `GameRoom.jsx` и
`gameRoom/components/*.jsx`. Это в `GameRoomKeyframes.jsx`:

```jsx
const KEYFRAMES = `
@keyframes svrSheetFade { ... }
@keyframes svrSheetUp { ... }
@keyframes svrReactPop { ... }
@keyframes svrDeckFade { ... }
@keyframes svrSeatArrowPulse { ... }
@keyframes svrSeatInviteBounce { ... }
@keyframes svrSeatInviteGlow { ... }
@keyframes svrSeatWaitPulse { ... }
`;
export function GameRoomKeyframes() {
  return <style>{KEYFRAMES}</style>;
}
```

## 7. Lazy modals — `src/components/modals/ModalsManager.jsx`

Все 6 пользовательских модалок теперь code-split через `React.lazy`:

```jsx
const DepositModal = lazy(() => import('../../modals/DepositModal').then(...));
const WithdrawModal = lazy(() => import('../../modals/WithdrawModal').then(...));
const CreateRoomModal = lazy(() => import('../../modals/CreateRoomModal').then(...));
const JoinByCodeModal = lazy(() => import('../../modals/JoinByCodeModal').then(...));
const RoomDetailsModal = lazy(() => import('../../modals/RoomDetailsModal').then(...));
const StartGameSheet = lazy(() => import('../../modals/StartGameSheet').then(...));
```

Обёрнуто в `<Suspense fallback={null}>` — спиннер тут только мешал бы
flicker'у. Поскольку chunk загружается на ~50ms через Telegram CDN,
этого достаточно.

**Bundle (по результатам `npm run build`):**

| Артефакт | v34 | v35 | Δ |
|----------|-----|-----|---|
| Initial JS bundle | 157.60 kB | **128.16 kB** | −29.44 kB |
| Initial JS bundle (gzip) | 44.21 kB | **36.91 kB** | −7.30 kB |
| DepositModal chunk | (в initial) | 12.37 kB | new |
| WithdrawModal chunk | (в initial) | 7.25 kB | new |
| CreateRoomModal chunk | (в initial) | 3.38 kB | new |
| RoomDetailsModal chunk | (в initial) | 3.17 kB | new |
| StartGameSheet chunk | (в initial) | 2.62 kB | new |
| JoinByCodeModal chunk | (в initial) | 0.93 kB | new |
| GameRoom chunk | 46.42 kB | 46.42 kB | (уже был lazy) |

Перцепция: открытие первого экрана быстрее, особенно на slow 3G в
Telegram. Дополнительные kB подгружаются только когда пользователь
реально открывает соответствующую модалку.

## 8. Telegram UX — safe-area-inset-bottom

На iPhone с home-indicator'ом нижние fixed-элементы могли заходить
под индикатор. Закрыто на трёх точках:

- `NavigationBar` — уже было (`paddingBottom: 'max(env(safe-area-inset-bottom), 6px)'`).
- `Sheet` (общий компонент в `components/ui/Sheet.jsx`) —
  `padding: '20px 20px max(env(safe-area-inset-bottom), 48px)'`.
- `ActionButtons` и `SpectatorBar` в GameRoom —
  `padding: '14px 18px max(env(safe-area-inset-bottom), 20px)'`.
  Фиксированный `height: 72` заменён на `minHeight: 72`, чтобы при
  ненулевом инсете кнопки не сжимались.
- `ChatPanel` уже использовал safe-area в bottom padding.

На устройствах без инсета вид не меняется (флор берёт исходное
значение).

## 9. Дополнительная мемоизация

Все sub-компоненты в `src/screens/profile/` и `src/modals/deposit/`
обёрнуты в `React.memo` с явными именами через `displayName`. В
`GameRoom.jsx` `Table`, `PotView`, `SeatsLayer` — тоже memo'd. Хуки
(`useSeatRotation`, `useChatReactions`, `useGameSettings`,
`useTgBackButton`, `useBodyScrollLock`) разбивают контекст рендера
так, что обновление одного слайса не дёргает остальные.

## 10. Итоги по строкам / файлам

| Файл | Было | Стало |
|------|------|-------|
| `src/GameRoom.jsx` | 820 | 288 |
| `src/modals/DepositModal.jsx` | 866 | 91 (orchestrator) |
| `src/screens/ProfileScreen.jsx` | 1476 | 174 (orchestrator в `profile/`) |
| **Σ трёх монолитов** | **3162** | **553** |

Около 2600 строк перенесено в маленькие, тестируемые компоненты с
явными именами и memo-обёртками. UI не изменён.

## Архитектурные решения (TL;DR)

1. **Backend-ready data layer.** `api/` + `websocket/` + `gameStore`
   уже моделируют сервер-контракт. Подключение бэкенда — это замена
   тел моков на `httpRequest()` + `wsClient.connect()`.
2. **State боундари: per-screen хуки.** Тяжёлая стейт-машина
   (seat rotation, chat reactions, game settings) живёт в
   `gameRoom/hooks/*` — изолированно от рендера. Один хук = одна
   ответственность.
3. **Design tokens как контракт.** Любой компонент берёт цвета /
   отступы / тени из `designSystem/*`. Тема (dark/light/oled) едет
   через CSS-variables в `index.html`.
4. **CSS Modules для шаблонных стилей, inline для динамических.**
   Layout, цвета, размеры — в .module.css. Animation-driven
   inline-стили (анимации сдачи карт с пер-сидячими delay) остаются
   inline, потому что они вычисляются из state.
5. **Lazy boundaries по UX-границам.** GameRoom (тяжёлый, редко
   нужен сразу) — lazy. Модалки (открываются по тапу) — lazy. Lobby
   / Profile / экраны турниров — synchronous, потому что навигация
   между ними должна быть мгновенной.
6. **Backwards-compatible re-exports.** Все старые пути импортов
   (`utils/theme`, `constants/design`, `screens/ProfileScreen`,
   `modals/DepositModal`) сохранены как shims — нет breaking changes
   для оставшихся компонентов, которые ещё на них ссылаются.

---

# v32 — Realtime Stability (Этап 8)

Цель захода: довести WebSocket-слой и game state slice до production-grade
для realtime multiplayer. UI не тронут.

## 1. Протокол: ping/pong, версии, snapshot resync

Добавлены два client-to-server события и одно server-to-client.

```
src/shared/protocol/
├── client/
│   ├── events.ts      ← + CLIENT_EVENTS.PING, CLIENT_EVENTS.REQUEST_SNAPSHOT
│   ├── payloads.ts    ← + PingPayloadSchema, RequestSnapshotPayloadSchema
│   ├── frames.ts      ← обе арки в ClientFrameSchema / ClientToServerEvents
│   └── index.ts
└── server/
    ├── events.ts      ← + SERVER_EVENTS.PONG
    ├── payloads.ts    ← + PongPayloadSchema; в GameTickPayloadSchema
    │                    добавлено поле version
    ├── frames.ts      ← арка PONG в ServerFrameSchema / ServerToClientEvents
    └── index.ts
```

Контракт:
- `PingPayload { t }` — клиент шлёт раз в `HEARTBEAT_INTERVAL_MS = 20s`.
- `PongPayload { t, serverTime? }` — сервер эхом возвращает `t`, клиент
  считает RTT = `now − t`.
- `RoomStatePayload.version` уже был; теперь `GameTickPayload.version` —
  тоже опциональное поле, помечающее версию комнаты, для которой
  собран тик.
- `RequestSnapshotPayload { roomId, sinceVersion? }` — клиент шлёт при
  reconnect и при version-mismatch, сервер отвечает полным
  `RoomState`.

## 2. WebSocket client — `src/websocket/client.ts`

Расширен без поломки публичного API (`connect`, `disconnect`, `send`,
`on`):

- **Heartbeat.** На `open` стартует `setInterval(sendPing, 20_000)`.
  Каждый ping ставит `setTimeout(closeSocket, PONG_TIMEOUT_MS = 8s)`.
  Если pong пришёл — таймер сбрасывается, RTT пишется в
  `connectionStore`. Если нет — `useConnectionStore.setStale(true)` и
  принудительный `socket.close()` → стандартный backoff reconnect.
- **Connection status broadcast.** Каждый переход (idle → connecting →
  open → closing → closed) публикуется в `useConnectionStore.status`.
  Не нужно polling-ить клиент из React.
- **Malformed-frame counter.** Любой дроп (non-JSON / failed
  `parseServerFrame`) бьёт `useConnectionStore.recordMalformed()`.
- **Lifecycle hooks.** `wsClient.onLifecycle('open' | 'reconnect' |
  'close', fn)` — для логики, которая должна срабатывать на reconnect
  (например, запрос свежего снапшота).
- **`notifyPong(echoedT)`** — публичный helper, который вызывается из
  storeBridge при получении pong-фрейма. Сбрасывает dead-socket таймер
  и пишет RTT.

## 3. Connection store — `src/store/connectionStore.ts`

```ts
useConnectionStore.getState() = {
  status,             // 'idle' | 'connecting' | 'open' | 'closing' | 'closed'
  reconnectAttempts,  // монотонный счётчик с последнего open
  lastRttMs,          // ms из последнего pong
  lastFrameAt,        // Date.now() последнего валидного фрейма
  malformedFrames,    // суммарный счётчик дропов
  isStale,            // true когда heartbeat не дождался pong
  setStatus, setReconnectAttempts, recordPong, recordFrame,
  recordMalformed, setStale, reset
}
```

UI может подписаться селектором, например
`useConnectionStore(s => s.status)` — компонент перерендерится только
когда статус реально сменился. Не путать с существующим
`ConnectionStatus.jsx` (он про browser-level offline, HTTP probe; этот
слой про WebSocket reachability).

## 4. Game store — versioning + desync detection

`RealtimeSlice` теперь:

```ts
{
  ...,
  version: number,    // последняя применённая RoomState.version
  lastTickT: number,  // последняя применённая GameTickPayload.t
  desyncCount: number // счётчик дропнутых stale-фреймов
}
```

Правила reconciliation:

- `applySnapshot(snapshot)`:
  - если `snapshot.version < state.version` → дроп (bump
    `desyncCount`). Старый снапшот не должен затирать свежее
    состояние.
  - иначе → применить, сбросить `lastTickT = 0`.
- `applyTick(tick)`:
  - если `tick.version !== state.version` → дроп (version mismatch —
    bridge на это шлёт `REQUEST_SNAPSHOT`).
  - если `tick.t <= state.lastTickT` → дроп (out-of-order delivery).
  - иначе → patch + поднять `lastTickT`.

Добавлено `resetRealtime()` — hard reset для тестов и для случая
"выходим из комнаты, но игра ещё не подгрузилась".

## 5. Toast store — `src/store/toastStore.ts`

Маленький транзиентный store для уведомлений (id, tone, message,
duration). Используется bridge'ом, чтобы поднимать server `ERROR`
фреймы к юзеру вместо тихого warn в консоль. Дальше его можно
подцепить к UI-уровню Toaster (отдельная задача — UI сейчас не
трогаем).

## 6. Bridge — `src/websocket/storeBridge.ts`

Расширен без изменения сигнатуры:

- `ROOM_STATE` → `game.applySnapshot()` (теперь с дроп-логикой
  по version).
- `GAME_TICK` → `game.applyTick()`; если бридж видит, что тик дропнулся
  из-за version mismatch (не из-за out-of-order `t`), он шлёт
  `CLIENT_EVENTS.REQUEST_SNAPSHOT` сам — без участия компонентов.
- `ROUND_RESULT` → как раньше, + опциональный delta баланса.
- `ERROR` → `toasts.pushToast({ tone: 'error', message })`.
- `PONG` → `wsClient.notifyPong(payload.t)`.
- Lifecycle `'reconnect'` → автоматический `REQUEST_SNAPSHOT` для
  активной комнаты.

Контракт "добавить новое event-flow" теперь:

1. Имя в `SERVER_EVENTS` / `CLIENT_EVENTS`.
2. Payload schema в `payloads.ts`.
3. Арка в `*FrameSchema`.
4. `wsClient.on(...)` или `wsClient.send(...)` в bridge / фиче.
5. Reducer в slice (если стейт меняется).

## 7. Что не менялось

- `App.jsx`, `GameRoom.jsx`, все экраны, модалки — не тронуты.
- `ConnectionStatus.jsx` остался как есть (HTTP-probe offline modal).
- Публичный API `wsClient.connect/disconnect/send/on` совместим
  с v31. Storebridge не требует знаний о heartbeat.
- Bundle: initial JS вырос с 134.52 → 138.49 kB (+4 kB / +1 kB gzip).
  Цена payload schemas + connectionStore + heartbeat кода.

## 8. Что осталось (следующие итерации)

- **Этап 3 (Zustand):** memoized selectors для derived state, если
  где-то реально создаются новые объекты в селекторе.
- **Этап 9 (Tests):** vitest для reducer-логики `applySnapshot` /
  `applyTick` (особенно ветки с version mismatch и out-of-order t),
  для protocol-валидаторов, для `wsClient` с mock WebSocket.
- **Этап 10 (DX):** Vite path alias (sync с tsconfig), eslint
  import-sort, husky + lint-staged.
- **Этап 6 (Folder):** feature-first можно навести постепенно; на
  текущем размере проекта по value-to-friction нерелевантно.



---

# v33 — Testing & DX (Этапы 9 + 10)

Дельта на верх v32. UI/UX/бизнес-логика не тронуты. Цель —
закрыть DX gaps (path alias, import sort, pre-commit hooks) и
покрыть тестами критическую realtime-логику.

## 1. Testing (Этап 9)

### 1.1 Инструментарий

- `vitest@^1.6.0` + `@vitest/coverage-v8` + `jsdom@^24`.
- Конфиг — `vitest.config.ts`. По умолчанию Node env,
  jsdom включается через `// @vitest-environment jsdom`
  pragma в начале файла (только там, где он нужен).
- Алиас `@/*` → `src/*` синхронизирован с `tsconfig.json` и
  `vite.config.js`.
- Скрипты:
  - `npm run test` — single run.
  - `npm run test:watch` — watch.

### 1.2 Что покрыто

Стартовый набор фокусируется на **realtime-критических** редьюсерах
и сетевом слое. Снап-тестов компонентов и интеграционных сценариев
с реальным сокетом пока нет — это следующая итерация.

| Файл                                                        | Что закрывает                                          |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| `src/shared/protocol/__tests__/serverFrames.test.ts`        | Парсинг ROOM_STATE / GAME_TICK / PONG, drop unknown,   |
|                                                             | drop frame с неверным payload, non-object input.       |
| `src/store/__tests__/gameStore.test.ts`                     | Версии: drop stale snapshot, drop tick с mismatch,     |
|                                                             | drop out-of-order по `t`, drop duplicate, resync       |
|                                                             | `lastTickT` после snapshot, applyPlayerJoined/Left,    |
|                                                             | applyRoundResult.                                      |
| `src/store/__tests__/connectionStore.test.ts`               | Стартовое состояние, recordPong → RTT + clears stale,  |
|                                                             | recordFrame timestamp, malformed counter, status flow. |
| `src/store/__tests__/toastStore.test.ts`                    | push/dismiss/clear, auto-dismiss по таймеру,           |
|                                                             | "sticky" toast (duration 0).                           |
| `src/websocket/__tests__/client.test.ts`                    | Безопасность offline send, on() unsubscribe, lifecycle |
|                                                             | API, notifyPong → connectionStore.                     |
| `src/websocket/__tests__/storeBridge.test.ts`               | ROOM_STATE → applySnapshot, GAME_TICK → applyTick,     |
|                                                             | version-mismatch → REQUEST_SNAPSHOT, ERROR → toast,    |
|                                                             | PONG → RTT.                                            |

Итого: 6 файлов, 37 тестов. Прогон ~2с локально.

### 1.3 Что НЕ покрыто намеренно

- React-компоненты: snapshot-тесты ради snapshot'ов не дают сигнала,
  лучше сделать пару user-flow тестов с `@testing-library/react`
  отдельной итерацией.
- WebSocket end-to-end с моком сокета: проще сделать через
  `mock-socket` пакет — стоит добавить когда появится повод
  (новый flow или regression).
- Backend-протокол сервер-сайд: не наша зона.

## 2. DX & Tooling (Этап 10)

### 2.1 Path alias

- `vite.config.js`: добавлен `resolve.alias: { '@': src }`.
- `vitest.config.ts`: тот же alias.
- `tsconfig.json` уже содержал `paths: { "@/*": ["src/*"] }` — теперь
  IDE и runtime разрешают одинаково.
- В коде ещё используются относительные пути; миграция
  необязательна и может идти инкрементально, alias просто доступен
  для нового кода.

### 2.2 Import sort

- Плагин `eslint-plugin-simple-import-sort`.
- Правило `simple-import-sort/imports` / `exports` включено
  **только для .ts/.tsx** (уровень `warn`), чтобы не упасть на
  .jsx-компонентах из v31.
- Прогон `npm run lint -- --fix` отсортировал все импорты в
  TS-файлах автоматически. Lint после этого 0 предупреждений.

### 2.3 Husky + lint-staged

- `husky@^9` + `lint-staged@^15`.
- `package.json` → `scripts.prepare: "husky"` устанавливает
  git hooks при `npm install`.
- `.husky/pre-commit` запускает `npx lint-staged`.
- `lint-staged` конфиг в `package.json`:
  - `*.{ts,tsx,js,jsx}`: `eslint --fix` + `prettier --write`
  - `*.{json,css,md}`: `prettier --write`
- Hook привязывается только если есть `.git/` (репозиторий) — на
  фронте zip-пакета это no-op, локально у пользователя сработает
  как ожидается.

### 2.4 Новые скрипты

- `npm run lint:fix` — autofix всего src.
- `npm run format` — prettier на src.
- `npm run format:check` — prettier check (для CI).

## 3. Проверка

- `npm run typecheck` — clean.
- `npm run lint` — 0 warnings, 0 errors.
- `npm run test` — 6 файлов, 37 тестов, all pass.
- `npm run build` — успешен, размеры идентичны v32 (тесты не
  попадают в bundle, alias не меняет ничего рантайм).

## 4. Что осталось (следующие итерации)

- **Этап 3 (Zustand):** memoized selectors там, где компонент
  реально пересоздаёт объекты. Без признаков проблемы trogать
  не нужно.
- **Этап 4 (GameRoom Performance):** профилирование `GameRoom.jsx`
  с React DevTools, если есть видимые frame drops.
- **Этап 5 (Design System):** inline styles → tokens — крупная,
  механическая работа, делать отдельным PR.
- **Этап 6 (Folder):** feature-first — пока value/friction не
  оправдывает.
- **Этап 11 (Production):** code splitting уже есть; для Telegram
  WebView полезно прогнать Lighthouse и посмотреть на memory.

---

# v33 — Этап 3 (Zustand selectors) — аудит

После прохода по всем 23 файлам, импортирующим store-хуки (51
селектор всего), **изменений не понадобилось**. Картина:

- Все потребители используют форму `useFooStore((state) => state.x)`
  где `x` — это либо примитив (string/number/boolean), либо
  стабильная ссылка на action из store. Zustand сравнивает
  результаты через `Object.is`, что для таких селекторов работает
  корректно.
- Производные значения уже мемоизированы там, где это имеет смысл
  (см. `src/hooks/useRooms.js` — `useMemo` поверх `rooms` + `filters`).
- Никто не возвращает свежие объекты (`() => ({ a, b })`) или
  массивы из селектора — нет повода для `shallow` сравнения.
- `App.jsx`, `GameRoom.jsx`, `ModalsManager.jsx`, `ScreenRouter.jsx`,
  `GameRoomHost.jsx`, `NavigationBar.jsx`, `LobbyScreen.jsx`,
  `TournamentsListScreen.jsx` — все следуют единому стилю.

Следовательно, Этап 3 уже выполнен на уровне v31 благодаря дисциплине
оригинального автора. Дополнительная мемоизация ради мемоизации
противоречит принципу "Simplicity First".

## Что НЕ закрыто (опциональные пункты на потом)

- **Toast viewport.** В v32 добавлен `toastStore`, который собирает
  серверные `ERROR`-фреймы, но visible UI для них нет. Принципиально
  ничего не сломается — toasts просто сидят в стейте. Добавить
  минимальный fixed-position overlay — отдельная UI-задача, требует
  явного согласования с дизайном (позиция, длительность, анимация
  входа/выхода). Сейчас оставлен как opt-in API.
- **Этап 4 (GameRoom performance).** Конкретных regression'ов не
  замечено, профилирование лучше делать на устройстве пользователя
  (Telegram WebView на Android — самый узкий бутылочное горло
  обычно).
- **Этап 5 (Design system).** Inline styles в `.jsx` остались —
  механическая, объёмная задача, отдельный PR.
- **Этап 6 (Folder structure).** Текущая структура читаема,
  feature-first можно навести инкрементально при добавлении новых
  фич.
- **Этап 11 (Production).** `manualChunks` уже разрулен (react,
  lottie, vendor отдельно), lazy modals активны, code splitting
  работает. Дальше — Lighthouse / Telegram WebView memory-profile.

---

# v34 — ToastViewport (хвост Этапа 7)

Закрыли последний loose end Этапа 7: серверные ошибки теперь
видимы пользователю. Логика осталась прежней — `toastStore`
сам по себе работал и в v32, ему просто не хватало UI.

## 1. Новый компонент

`src/components/ToastViewport.jsx` — минимальный pure-render
overlay:

- `position: fixed` сверху, `Z_INDEX.toast` (выше bottomBar,
  ниже GameRoom) — слот в z-index scale уже был зарезервирован.
- Pointer events идут сквозь viewport, ловит клики только
  pill сам.
- Стилизация — только токены (`COLORS`, `RADIUS`, `SPACING`,
  `Z_INDEX`). Inline magic numbers только в boxShadow
  (выделить в `SHADOWS.toast` — следующая итерация если
  будем доделывать design system).
- Цвет акцентной полоски маппится по `tone`:
  `info=accent`, `success=green`, `warning=gold`, `error=red`.
- Если `toasts.length === 0` — возвращает `null`, нулевой
  оверхед когда тостов нет.
- Auto-dismiss остаётся в `toastStore` (setTimeout); компонент
  без локального state.

## 2. Mount point

`App.jsx`: добавлен `<ToastViewport />` после `<ConnectionStatus />`,
внутри `<RootLayout>`. UI/UX до момента появления тоста
визуально не меняется (overlay невидим).

## 3. Тесты

`src/components/__tests__/ToastViewport.test.jsx` — 3 кейса:
- Пустой стор → ничего не рендерим.
- Несколько тостов → каждый отображён в порядке push.
- Клик по тосту → `dismissToast` снимает его из стора.

Прогон `vitest`: 7 файлов, **40 тестов**, все зелёные.

## 4. Инфраструктура тестов

- Подключён `@testing-library/react` + `@testing-library/jest-dom`.
- `vitest.config.ts`:
  - `plugins: [react()]` — чтобы automatic JSX runtime работал
    в тестах.
  - `include` расширен `.jsx` так как наш первый компонент-тест
    в JSX.

## 5. Bundle impact

Initial JS: 138.49 → 139.52 kB (+1.03 kB raw / +0.32 kB gzip).
Цена компонента + selector в App.jsx.

## 6. Что не сделано намеренно

- **Анимации входа/выхода.** Виды дизайна нет, добавлять
  керамические `transition` без согласования — UX-долг.
- **Локализация tone-иконок.** Сейчас только цветная полоска,
  без иконки. Иконку добавлять под существующий icon-сет —
  отдельная задача.
- **Per-tone background.** Все toasts на `bg2` (как остальные
  карточки в UI), tone выделен только полоской. Согласовано
  с принципом "не менять UX".

## Дальнейшие приоритеты (по убыванию value)

1. **Этап 5 (Design system)** — inline styles → tokens.
   Сейчас в `.jsx` много прямых `style={{ ... }}` с числами и
   hex-цветами; стоит привести к `COLORS / SPACING / RADIUS /
   SHADOWS`. Объёмная, но механическая работа.
2. **Этап 4 (GameRoom performance)** — только при наличии
   замеренного regression. Без сигнала не лезу.
3. **Этап 11 (Production)** — Lighthouse + memory profile в
   Telegram WebView. Тут value-prop конкретный (Android low-end
   часто тормозит из-за памяти).
4. **Этап 6 (Folder structure)** — feature-first можно
   постепенно при росте проекта.

---

# v35 — Этап 5 (brand color tokens) + Этап 11 (bundle audit)

## 1. Этап 5 — точечная миграция к токенам

Полная миграция 555 inline-стилей к токенам — это 41 файл и
несколько тысяч строк изменений, что противоречит "Surgical
Changes". Вместо неё прошёл по **прямым дубликатам существующих
brand-токенов** — 9 точечных замен, где hex-литерал семантически
равен `BRAND.*`:

| Файл                                             | Замена                          |
| ------------------------------------------------ | ------------------------------- |
| `SettingsRows.jsx`                               | `'#2481cc'` → `BRAND.accent`    |
| `ErrorBoundary.jsx`                              | `'#e05c5c'` → `BRAND.red`       |
| `ConnectionStatus.jsx`                           | `'#e05c5c'` → `BRAND.red`       |
| `components/ui/Dropdown.jsx` (default param)     | `'#2481cc'` → `BRAND.accent`    |
| `gameRoom/components/Menu.jsx` (toggle on / preset highlight) | `'#2481cc'` → `BRAND.accent`     |
| `gameRoom/components/Chat.jsx` (accent ref)      | `'#2481cc'` → `BRAND.accent`    |
| `screens/profile/components/StatsTriplet.jsx`    | `'#26A17B'` → `BRAND.usdt`      |
| `screens/profile/icons/MenuIcons.jsx` (3 stroke colors) | `'#26A17B'/'#f5a623'/'#2481cc'` → `BRAND.usdt`/`BRAND.gold`/`BRAND.accent` |

**Что НЕ заменено (намеренно):**

- **Градиенты типа `linear-gradient(135deg,#2481cc,#1a6fb0)`.** Второй
  стоп (`#1a6fb0`) — производный оттенок, не входит в палитру.
  Заменить только первый — получится грязный mix токен+магия,
  что хуже исходного. Если потом захочется — нужно добавить
  `BRAND.accentDark` и заменить пару целиком, отдельной задачей.
- **`#ffffff`** — белый текст на тёмных поверхностях есть в десятках
  мест, прямой замены нет. Часть из них правильно бы вынести
  в `var(--on-accent)`, но это уже не token replacement а
  пересборка theme-схемы.
- **Уникальные иконочные fill'ы (`CardIcon`, `UsdtIcon`).** Они
  буквально являются self-contained брендингом ассета; перевод
  в токены только запутает.
- **Менее тривиальные одноразовые цвета.** Например `#e07b5c`
  (бэйдж новостей) или `#8b7cf6` (бэйдж агрумента) — это
  единичные accent-цвета, для которых нет соответствующего
  токена. Если их добавим в палитру — лучше отдельным
  дизайн-обсуждением.

## 2. Этап 11 — bundle audit

Анализ собранного `dist/assets/`:

| Чанк                       | Размер | Когда грузится                   |
| -------------------------- | ------ | --------------------------------- |
| `react-*.js`               | 139K   | initial (React + scheduler)      |
| `index-*.js`               | 144K   | initial (App shell, screens, ws) |
| `vendor-*.js`              | 58K    | initial (zustand, zod, etc.)     |
| `GameRoom-*.js`            | 63K    | lazy — после клика по комнате     |
| `lottie-*.js`              | 301K   | lazy — внутри GameRoom (Chat)    |
| `DepositModal-*.js`        | 13K    | lazy — при открытии депозита     |
| Остальные модалки          | 1-8K   | lazy                              |

Initial bundle ≈ **341K minified** (≈100K gzip с учётом
`react` ~45K gz + `index` ~41K gz + `vendor` ~14K gz). Это
терпимо для Telegram WebView. GameRoom + Lottie грузятся
только когда пользователь реально входит в комнату.

Возможные дальнейшие оптимизации (НЕ применил, требуют
теста на реальных анимациях):

- Замена `import lottie from 'lottie-web'` на
  `lottie-web/build/player/lottie_light` — рендерит только SVG
  (нам как раз только SVG и нужен) и без expressions. Потенциал
  ~120K экономии в lottie-чанке. Риск: некоторые Google Noto
  emoji JSON могут зависеть от expressions, нужно проверить
  визуально каждый эмодзи. Без визуальной верификации не делаю.
- Preload вкладки `Chat` асинхронно через `import.prefetch`
  при попадании пользователя в GameRoom — устранит "первый
  клик медленный" эффект.
- `manualChunks` сейчас группирует всё `node_modules` в `vendor`.
  Если zustand окажется крупным, можно вынести.

## 3. Проверка

- `npm run typecheck` ✓
- `npm run lint` ✓ (0 warns)
- `npm run test` ✓ (7 файлов, 40 тестов)
- `npm run build` ✓ (`✓ built in 2.02s`), размеры идентичны v34
