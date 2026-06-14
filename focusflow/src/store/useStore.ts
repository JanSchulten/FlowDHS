import { useReducer, useEffect, useRef } from 'react';
import { reducer, INITIAL_STATE } from './reducer';
import type { AppState, Action } from './reducer';

function saveToStorage(state: AppState) {
  try {
    const { pom: _pom, activePage: _ap, projectFilter: _pf, confettiTrigger: _ct, ...persist } = state;
    localStorage.setItem('ff2_state', JSON.stringify(persist));
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
