import { useEffect, useRef } from 'react';

const COLORS = ['var(--pri)', 'var(--dopa)', 'var(--ok)', 'var(--focus)', 'var(--warn)'];

export function useConfetti(trigger: number, enabled: boolean) {
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (!enabled || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    for (let i = 0; i < 20; i++) {
      const el = document.createElement('div');
      el.className = 'conf';
      el.style.cssText = [
        `left:${20 + Math.random() * 60}vw`,
        `top:${40 + Math.random() * 40}vh`,
        `background:${COLORS[i % 5]}`,
        `animation-delay:${Math.random() * 0.4}s`,
        `animation-duration:${0.8 + Math.random() * 0.8}s`,
      ].join(';');
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }, [trigger, enabled]);
}
