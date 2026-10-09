# API Contracts

GET /api/health and /api/skills are public. POST /api/demo creates isolated fictional records. /api/auth/register, login, logout manage local sessions. /api/me returns a safe identity. /api/classrooms supports list/create; POST /api/classrooms/enroll takes a code. /api/questions previews generation. /api/assignments supports list/publish. /api/submissions creates one record per student/assignment. Submission routes expose GET, PATCH transcription, POST confirm/image/reviews, and GET image. Classroom routes expose submissions, analytics, and cursor-based events. Mutations require an Origin matching the request origin. Validation is in packages/contracts; contracts differ from representative target endpoints where documented.

Related: [[00-START-HERE]] · [[Current-State]]
