import {
  createContext, useContext, useState, useEffect,
  type ReactNode,
} from 'react';

export type FontSize = 'normal' | 'large' | 'xl';

const FONT_SCALE: Record<FontSize, number> = { normal: 1, large: 17 / 14, xl: 20 / 14 };

interface AccessibilityContextValue {
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  enhancedFocus: boolean;
  setEnhancedFocus: (v: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function readBoolean(key: string, fallback: boolean): boolean {
  const saved = localStorage.getItem(key);
  return saved === null ? fallback : saved === 'true';
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('a11y-font-size');
    return saved === 'large' || saved === 'xl' ? saved : 'normal';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => readBoolean('a11y-high-contrast', false));
  const [reduceMotion, setReduceMotion] = useState<boolean>(() =>
    readBoolean('a11y-reduce-motion', window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  );
  const [enhancedFocus, setEnhancedFocus] = useState<boolean>(() => readBoolean('a11y-enhanced-focus', false));

  useEffect(() => {
    (document.documentElement.style as CSSStyleDeclaration & { zoom: string }).zoom = String(FONT_SCALE[fontSize]);
    localStorage.setItem('a11y-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    localStorage.setItem('a11y-high-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-motion', reduceMotion ? 'reduced' : 'normal');
    localStorage.setItem('a11y-reduce-motion', String(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    document.documentElement.setAttribute('data-focus', enhancedFocus ? 'enhanced' : 'normal');
    localStorage.setItem('a11y-enhanced-focus', String(enhancedFocus));
  }, [enhancedFocus]);

  return (
    <AccessibilityContext.Provider value={{
      fontSize, setFontSize, highContrast, setHighContrast, reduceMotion, setReduceMotion, enhancedFocus, setEnhancedFocus,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}