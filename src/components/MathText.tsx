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
            return katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return part;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          try {
            return katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return part;
          }
        }
        return part;
      })
      .join('');
  }, [text, displayMode]);

  return (
    <span
      className={`inline-block leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
