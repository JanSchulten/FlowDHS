import { useReducer, useEffect, useRef } from 'react';
import { reducer, INITIAL_STATE, toSnapshot } from './reducer';
import type { AppState, Action } from './reducer';

function saveToStorage(state: AppState) {
  try {
    localStorage.setItem('ff2_state', JSON.stringify(toSnapshot(state)));
  } catch {}
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    saveToStorage(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return { state, dispatch };
}

export type { AppState, Action };
