# Event Replay Architecture

domain_events stores an increasing global sequence, unique event ID, classroom ID, optional submission ID, type, compact payload, and timestamp. Events are written in the same transaction as grading and release. The current UI exposes ordered history and a replay-position slider; it is not yet a state reconstruction engine. Global sequence gaps are not proof of missing classroom events because other classrooms share the sequence. Duplicate/missing/out-of-order reducer testing remains a separate task.

Related: [[00-START-HERE]] · [[Current-State]]
