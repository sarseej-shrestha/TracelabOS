import type { QuestionFigure } from '../../question-bank/src/types';
import { FractionBars } from './fraction-bars';
export function QuestionDiagram({ figure }: { figure: QuestionFigure }) {
  if (figure.kind === 'fraction-bars') return <FractionBars figure={figure} />;
  const parts = figure.parts.slice(0, 2);
  return (
    <figure className="algebra-figure">
      <svg
        role="img"
        aria-label={
          parts.length === 2
            ? `Equation: ${parts[0]} equals ${parts[1]}`
            : `Expression: ${parts[0]}`
        }
        viewBox="0 0 340 92"
        width="340"
        height="92"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {parts.map((part, index) => (
          <g key={index}>
            <rect
              x={parts.length === 1 ? 8 : index === 0 ? 8 : 185}
              y="24"
              width={parts.length === 1 ? 324 : 147}
              height="48"
              rx="4"
              fill="#f5f8f2"
              stroke="#26463b"
            />
            <text
              x={parts.length === 1 ? 170 : index === 0 ? 81 : 258}
              y="54"
              textAnchor="middle"
              fill="#193d30"
              fontSize="16"
            >
              {part}
            </text>
          </g>
        ))}
        {parts.length === 2 && (
          <text x="170" y="55" textAnchor="middle" fill="#193d30" fontSize="24">
            =
          </text>
        )}
      </svg>
      <figcaption>{figure.caption}</figcaption>
    </figure>
  );
}
