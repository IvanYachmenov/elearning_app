import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface NavigationLockState {
  isLocked: boolean;
  reason: string;
  allowedPaths: string[];
}

interface NavigationLockContextValue {
  isLocked: boolean;
  lockReason: string;
  allowedPaths: string[];
  lockNavigation: (reason?: string, allowedPaths?: string[]) => void;
  unlockNavigation: () => void;
}

const DEFAULT_REASON = 'Navigation is locked during the current activity.';
const NavigationLockContext = createContext<NavigationLockContextValue | undefined>(undefined);

export function NavigationLockProvider({ children }: { children: ReactNode }) {
  const [lockState, setLockState] = useState<NavigationLockState>({
    isLocked: false,
    reason: '',
    allowedPaths: [],
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

  const lockNavigation = useCallback((reason?: string, allowedPaths?: string[]) => {
    setLockState({
      isLocked: true,
      reason: reason || DEFAULT_REASON,
      allowedPaths: allowedPaths?.length ? allowedPaths : [],
    });
  }, []);

  const unlockNavigation = useCallback(() => {
    setLockState({ isLocked: false, reason: '', allowedPaths: [] });
  }, []);

  const value = useMemo<NavigationLockContextValue>(
    () => ({
      isLocked: lockState.isLocked,
      lockReason: lockState.reason,
      allowedPaths: lockState.allowedPaths,
      lockNavigation,
      unlockNavigation,
    }),
    [lockState, lockNavigation, unlockNavigation],
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
