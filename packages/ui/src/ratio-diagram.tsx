import type { RatioFigure } from '../../question-bank/src/types';
export function RatioDiagram({ figure }: { figure: RatioFigure }) {
  const rows = figure.rows.slice(0, 8);
  if (figure.kind === 'ratio-table')
    return (
      <figure className="ratio-figure">
        <table>
          <caption>{figure.caption}</caption>
          <thead>
            <tr>
              {figure.labels.map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    );
  return (
    <figure className="ratio-figure">
      <svg
        role="img"
        aria-label={`Double number line: ${rows.map((row) => `${row[0]} ${figure.labels[0]} corresponds to ${row[1]} ${figure.labels[1]}`).join('; ')}`}
        viewBox="0 0 440 180"
        width="440"
        height="180"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {figure.labels.map((label, axis) => (
          <g key={label}>
            <text x="16" y={axis * 85 + 18} fill="#193d30" fontSize="14">
              {label}
            </text>
            <line
              x1="28"
              x2="412"
              y1={axis * 85 + 54}
              y2={axis * 85 + 54}
              stroke="#26463b"
            />
            {rows.map((row, i) => {
              const x =
                28 +
                384 *
                  Math.max(
                    0,
                    Math.min(
                      1,
                      figure.positions?.[i] ?? i / Math.max(1, rows.length - 1),
                    ),
                  );
              return (
                <g key={i}>
                  <line
                    x1={x}
                    x2={x}
                    y1={axis * 85 + 48}
                    y2={axis * 85 + 60}
                    stroke="#26463b"
                  />
                  <text
                    x={x}
                    y={axis * 85 + 40}
                    textAnchor="middle"
                    fill="#193d30"
                    fontSize="15"
                  >
                    {row[axis]}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <figcaption>{figure.caption}</figcaption>
    </figure>
  );
}
