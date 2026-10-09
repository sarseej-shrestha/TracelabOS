# ADR 0002 Database Selection

Status: local adapter accepted; production Neon selection provisional. Network/credential restrictions prevent a hosted PostgreSQL experiment. Use actual local SQLite persistence to verify transactions and constraints immediately; do not substitute an in-memory mock for application storage. Keep the full normalized PostgreSQL migration and adapter as a dedicated next task. SQLite tests cannot certify PostgreSQL semantics, deployment, or query performance.

Related: [[00-START-HERE]] · [[Current-State]]
