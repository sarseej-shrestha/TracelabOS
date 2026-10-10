import type { GeometryFigure } from '../../question-bank/src/types';
export function GeometryDiagram({ figure }: { figure: GeometryFigure }) {
  return (
    <figure className="geometry-figure">
      <svg
        viewBox="0 0 360 235"
        width="360"
        height="235"
        role="img"
        aria-label={`${figure.labels.map((label) => label.text).join('; ')}. ${figure.caption}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        <polygon
          points={figure.points.map((p) => p.join(',')).join(' ')}
          fill="#e4edde"
          stroke="#26463b"
          strokeWidth="2"
        />
        {figure.guides?.map((guide, i) => (
          <g key={i}>
            <line
              x1={guide.from[0]}
              y1={guide.from[1]}
              x2={guide.to[0]}
              y2={guide.to[1]}
              stroke="#26463b"
              strokeDasharray="5 4"
            />
            {figure.points.length === 3 && (
              <path
                d={`M ${guide.to[0]} ${guide.to[1] - 8} h 8 v 8`}
                fill="none"
                stroke="#26463b"
              />
            )}
          </g>
        ))}
        {figure.labels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fill="#193d30"
            fontSize="14"
          >
            {label.text}
          </text>
        ))}
      </svg>
      <figcaption>{figure.caption}</figcaption>
    </figure>
  );
}
