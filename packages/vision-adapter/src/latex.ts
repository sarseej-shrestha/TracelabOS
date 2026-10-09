/** A bounded conversion for the engine's supported syntax. Unknown commands remain unconverted. */
export function plainMath(latex: string): string | null {
  if (latex.length > 512) return null;
  const input = latex
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, '')
    .replace(/\\(?:cdot|times)(?![a-zA-Z])/g, '*')
    .replace(/\\div(?![a-zA-Z])/g, '/')
    .replace(/\\[!,;]/g, ' ');
  let index = 0;
  function group(depth: number, closing = false): string {
    if (depth > 16) throw new Error('depth');
    let result = '';
    while (index < input.length) {
      const ch = input[index]!;
      if (ch === '}') {
        if (!closing) throw new Error('brace');
        index++;
        return result;
      }
      if (ch === '{') {
        index++;
        result += `(${group(depth + 1, true)})`;
        continue;
      }
      const fraction = input
        .slice(index)
        .match(/^\\(?:frac|dfrac|tfrac)(?![a-zA-Z])/);
      if (fraction) {
        index += fraction[0].length;
        const argument = () => {
          while (/\s/.test(input[index] ?? '') && index < input.length) index++;
          if (input[index++] !== '{') throw new Error('fraction');
          const value = group(depth + 1, true);
          if (!value.trim()) throw new Error('empty fraction');
          return value;
        };
        result += `((${argument()})/(${argument()}))`;
        continue;
      }
      if (!/[0-9x+\-*/=().\s]/.test(ch)) throw new Error('unsupported');
      result += ch;
      index++;
    }
    if (closing) throw new Error('brace');
    return result;
  }
  try {
    const text = group(0).trim();
    if (!text || /\d\s+\d/.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}
