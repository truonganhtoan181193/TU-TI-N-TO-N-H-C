import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
  displayMode?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  displayMode = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!text) return '';

    if (displayMode) {
      const clean = text.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '');
      try {
        return katex.renderToString(clean, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return clean;
      }
    }

    // Parse $...$ and $$...$$ inline/display formulas
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

    return parts
      .map((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
            return `<div class="math-display-unit my-2 overflow-x-auto text-center">${html}</div>`;
          } catch {
            return `<div class="math-display-unit my-2">${part}</div>`;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
            // Wrap in an indivisible inline-block with whitespace-nowrap.
            // If the formula does not fit on the current line, the browser breaks line BEFORE the formula.
            return `<span class="math-formula-unit inline-block whitespace-nowrap align-middle my-0.5 mx-0.5">${html}</span>`;
          } catch {
            return `<span class="math-formula-unit inline-block whitespace-nowrap">${part}</span>`;
          }
        }
        // Handle explicit newlines in text parts (convert \n to <br class="formula-break" />)
        return part.replace(/\n/g, '<br class="formula-break leading-relaxed" />');
      })
      .join('');
  }, [text, displayMode]);

  return (
    <span
      className={`inline-block leading-relaxed max-w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

