import { useMemo } from 'react';
import {
  replayClassroom,
  type ClassroomEvent,
} from '../../../services/realtime/src/replay';

export function ClassroomReplay({
  events,
  cursor,
  setCursor,
}: {
  events: ClassroomEvent[];
  cursor: number;
  setCursor: (value: number) => void;
}) {
  const result = useMemo(
    () => replayClassroom(events, cursor),
    [events, cursor],
  );
  return (
    <section className="card" aria-labelledby="replay-heading">
      <div className="section-title">
        <h2 id="replay-heading">Classroom time machine</h2>
        <span className="eyebrow">RECORDED MILESTONES</span>
      </div>
      <p>
        Move through the captured event history to reconstruct recorded
        progress. Refresh progress to capture newer events. This view does not
        include unrecorded drafts or photographs.
      </p>
      <label>
        Replay position · {cursor} of {events.length}
        <input
          type="range"
          min={0}
          max={events.length}
          value={cursor}
          onChange={(event) => setCursor(Number(event.target.value))}
        />
      </label>
      <div
        className="replay-summary"
        role="status"
        aria-label="Reconstructed progress"
      >
        <p>
          {result.assignments.length} published assignments ·{' '}
          {result.submissions.length} observed submissions · through sequence{' '}
          {result.through}.
        </p>
        <ul>
          {result.states.map(({ state, count }) => (
            <li key={state}>
              {state.replaceAll('_', ' ')}: {count}
            </li>
          ))}
        </ul>
        <p>Latest recorded review decisions at this position:</p>
        {result.decisions.length ? (
          <ul>
            {result.decisions.map(({ decision, count }) => (
              <li key={decision}>
                {decision.replaceAll('_', ' ')}: {count}
              </li>
            ))}
          </ul>
        ) : (
          <p>No released reviews yet.</p>
        )}
      </div>
      {result.warnings.length > 0 && (
        <div className="replay-warning" role="note">
          <p>
            History has {result.warnings.length} replay warnings. Recorded
            milestones may be incomplete; inspect current submissions before
            making decisions.
          </p>
          <details>
            <summary>Inspect replay warnings</summary>
            <ul>
              {result.warnings.map((warning, index) => (
                <li key={index}>
                  Sequence {warning.sequence}:{' '}
                  {warning.code.replaceAll('_', ' ').toLowerCase()}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      <details>
        <summary>Events through this position</summary>
        <ol className="events">
          {events.slice(0, cursor).map((event) => (
            <li key={event.id}>
              <span>{event.type.replaceAll('_', ' ').toLowerCase()}</span>
              <time dateTime={event.created_at}>
                {new Date(event.created_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ol>
      </details>
      <p className="lab-status">
        Replay version {result.version}. Sequence numbers are shared across
        classrooms; gaps alone do not indicate missing history.
      </p>
    </section>
  );
}
