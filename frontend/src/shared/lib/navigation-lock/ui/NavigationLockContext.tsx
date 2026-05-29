import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface LockAction {
  label: string;
  onAction: () => void;
  disabled?: boolean;
}

interface NavigationLockState {
  isLocked: boolean;
  reason: string;
  allowedPaths: string[];
  action: LockAction | null;
}

interface NavigationLockContextValue {
  isLocked: boolean;
  lockReason: string;
  allowedPaths: string[];
  lockAction: LockAction | null;
  lockNavigation: (reason?: string, allowedPaths?: string[], action?: LockAction | null) => void;
  setLockAction: (action: LockAction | null) => void;
  unlockNavigation: () => void;
}

const DEFAULT_REASON = 'Navigation is locked during the current activity.';
const NavigationLockContext = createContext<NavigationLockContextValue | undefined>(undefined);

export function NavigationLockProvider({ children }: { children: ReactNode }) {
  const [lockState, setLockState] = useState<NavigationLockState>({
    isLocked: false,
    reason: '',
    allowedPaths: [],
    action: null,
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!lockState.isLocked) {
        return;
      }

      event.preventDefault();
      event.returnValue = lockState.reason || DEFAULT_REASON;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [lockState.isLocked, lockState.reason]);

  const lockNavigation = useCallback(
    (reason?: string, allowedPaths?: string[], action?: LockAction | null) => {
      setLockState({
        isLocked: true,
        reason: reason || DEFAULT_REASON,
        allowedPaths: allowedPaths?.length ? allowedPaths : [],
        action: action ?? null,
      });
    },
    [],
  );

  const setLockAction = useCallback((action: LockAction | null) => {
    setLockState((previous) => ({ ...previous, action }));
  }, []);

  const unlockNavigation = useCallback(() => {
    setLockState({ isLocked: false, reason: '', allowedPaths: [], action: null });
  }, []);

  const value = useMemo<NavigationLockContextValue>(
    () => ({
      isLocked: lockState.isLocked,
      lockReason: lockState.reason,
      allowedPaths: lockState.allowedPaths,
      lockAction: lockState.action,
      lockNavigation,
      setLockAction,
      unlockNavigation,
    }),
    [lockState, lockNavigation, setLockAction, unlockNavigation],
  );

  return (
    <NavigationLockContext.Provider value={value}>
      {children}
    </NavigationLockContext.Provider>
  );
}

export function useNavigationLock(): NavigationLockContextValue {
  const context = useContext(NavigationLockContext);
  if (!context) {
    throw new Error('useNavigationLock must be used within NavigationLockProvider');
  }

  return context;
}
