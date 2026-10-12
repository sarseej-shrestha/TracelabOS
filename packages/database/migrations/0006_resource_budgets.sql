CREATE TABLE resource_budgets (
  resource TEXT PRIMARY KEY CHECK(resource IN ('mutations','identities','authentication','uploads')),
  day BIGINT NOT NULL CHECK(day>=0),
  day_used BIGINT NOT NULL CHECK(day_used>=0),
  total_used BIGINT NOT NULL CHECK(total_used>=day_used)
);
