# Database Architecture

The local adapter uses SQLite with foreign keys, WAL, busy timeout, unique submission identity, immutable transcription/evaluation records, and indexed classroom/event queries. Its schema bootstrap is version 1. Production PostgreSQL selection remains accepted in principle but unimplemented. Local images are private BLOBs; replacing them with R2 requires cross-resource reconciliation. See [[Database-Schema]] and [[ADR-0002-Database-Selection]].

Related: [[00-START-HERE]] · [[Current-State]]
