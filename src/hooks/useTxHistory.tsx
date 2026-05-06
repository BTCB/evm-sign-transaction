import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { useAccount, useAccountEffect } from 'wagmi';

export type TxStatus = 'pending' | 'success' | 'reverted';

export type TxHistoryEntry = {
  chainId: number;
  hash: `0x${string}`;
  status: TxStatus;
  timestamp: number;
};

type Action =
  | { type: 'add'; entry: TxHistoryEntry }
  | { type: 'updateStatus'; hash: `0x${string}`; status: TxStatus }
  | { type: 'clear' };

function reducer(state: TxHistoryEntry[], action: Action): TxHistoryEntry[] {
  switch (action.type) {
    case 'add':
      // Newest first; dedupe by hash defensively in case of fast-double-submit.
      if (state.some((e) => e.hash === action.entry.hash)) return state;
      return [action.entry, ...state];
    case 'updateStatus':
      return state.map((e) =>
        e.hash === action.hash ? { ...e, status: action.status } : e
      );
    case 'clear':
      return [];
    default:
      return state;
  }
}

type TxHistoryContextValue = {
  entries: TxHistoryEntry[];
  add: (entry: TxHistoryEntry) => void;
  updateStatus: (hash: `0x${string}`, status: TxStatus) => void;
  clear: () => void;
};

const TxHistoryContext = createContext<TxHistoryContextValue | null>(null);

export function TxHistoryProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(reducer, []);
  const lastAddressRef = useRef<string | undefined>(undefined);
  const { address } = useAccount();

  // ADR executor-time hint Step 9.5: seed lastAddressRef on mount so an
  // already-connected user doesn't trigger a false "first switch" clear.
  useEffect(() => {
    if (lastAddressRef.current === undefined && address) {
      lastAddressRef.current = address;
    }
    // run once at mount; subsequent updates handled by useAccountEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAccountEffect({
    onConnect: ({ address: nextAddress }) => {
      if (lastAddressRef.current && lastAddressRef.current !== nextAddress) {
        dispatch({ type: 'clear' });
      }
      lastAddressRef.current = nextAddress;
    },
    onDisconnect: () => {
      dispatch({ type: 'clear' });
      lastAddressRef.current = undefined;
    },
  });

  const add = useCallback((entry: TxHistoryEntry) => dispatch({ type: 'add', entry }), []);
  const updateStatus = useCallback(
    (hash: `0x${string}`, status: TxStatus) =>
      dispatch({ type: 'updateStatus', hash, status }),
    []
  );
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(
    () => ({ entries, add, updateStatus, clear }),
    [entries, add, updateStatus, clear]
  );

  return <TxHistoryContext.Provider value={value}>{children}</TxHistoryContext.Provider>;
}

export function useTxHistory(): TxHistoryContextValue {
  const ctx = useContext(TxHistoryContext);
  if (!ctx) {
    throw new Error('useTxHistory must be used inside <TxHistoryProvider>');
  }
  return ctx;
}
