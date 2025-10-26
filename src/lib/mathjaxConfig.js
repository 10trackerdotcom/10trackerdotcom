// Centralized MathJax configuration for consistent behavior across the application
export const MATHJAX_CONFIG = {
  "fast-preview": { disabled: true },
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
  messageStyle: "none",
  showMathMenu: false,
  showProcessingMessages: false,
  skipStartupTypeset: true,
  // Performance optimizations
  jax: ["input/TeX", "output/SVG"],
  svg: {
    fontCache: "global",
    linebreaks: { automatic: true, width: "container" }
  },
  // Error handling
  errorSettings: {
    message: ["[MathJax Error: %1]"],
    style: {
      "font-family": "serif",
      "font-size": "90%",
      "color": "#C00",
      "background": "#FFEEEE",
      "border": "1px solid #C00",
      "padding": "1px 3px"
    }
  }
};

// MathJax utility functions
export const MathJaxUtils = {
  // Force MathJax to re-render content
  typeset: () => {
    try {
      if (typeof window === 'undefined') return Promise.resolve();
      if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        return window.MathJax.typesetPromise();
      }
      return Promise.resolve();
    } catch (err) {
      // Swallow typeset errors to avoid crashing the UI
      return Promise.resolve();
    }
  },

  // Clear MathJax cache for a specific element
  clearCache: (element) => {
    try {
      if (!element) return;
      if (typeof window === 'undefined') return;
      if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
        const mathElements = element.querySelectorAll('[data-mathjax]');
        mathElements.forEach(el => {
          if (el && el._mathjax) {
            window.MathJax.startup.document.state(0).clearMathItemsIn(el);
          }
        });
      }
    } catch (_) {
      // no-op
    }
  },

  // Check if MathJax is loaded
  isLoaded: () => {
    try {
      if (typeof window === 'undefined') return false;
      return !!(window.MathJax && window.MathJax.typesetPromise);
    } catch (_) {
      return false;
    }
  }
};
