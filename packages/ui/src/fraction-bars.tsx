import type { FractionFigure } from '../../question-bank/src/types';
/** Known rational operands rendered directly as SVG; never interprets an uploaded diagram. */
export function FractionBars({ figure }: { figure: FractionFigure }) {
  return (
    <figure className="fraction-figure">
      {figure.fractions.slice(0, 2).map((fraction, index) => {
        const { numerator, denominator, label } = fraction;
        if (
          !Number.isInteger(numerator) ||
          !Number.isInteger(denominator) ||
          denominator < 1 ||
          denominator > 96 ||
          numerator < 0 ||
          numerator > denominator
        )
          return null;
        return (
          <svg
            key={index}
            role="img"
            aria-label={`${label}: ${numerator} of ${denominator} equal parts shaded`}
            viewBox="0 0 340 90"
            width="340"
            height="90"
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          >
            <text x="8" y="20" fill="currentColor" fontSize="14">
              {label}: {numerator}/{denominator}
            </text>
            {Array.from({ length: denominator }, (_, part) => (
              <rect
                key={part}
                x={8 + (part * 320) / denominator}
                y="32"
                width={320 / denominator}
                height="36"
                fill={part < numerator ? '#24644c' : '#f5f8f2'}
                stroke="#26463b"
                strokeWidth="1"
              />
            ))}
          </svg>
        );
      })}
      <figcaption>{figure.caption}</figcaption>
    </figure>
  );
}
