# Component Architecture

packages/math-engine has no web/database dependency. question-bank imports Rational for reference answers; learning-engine reads known skill prerequisites and evaluation evidence. contracts holds boundary schemas and the state graph. vision-adapter validates provider output without grading. services/api coordinates these modules in database transactions. apps/web renders server-owned records. Avoid coupling UI state directly to database internals.

Related: [[00-START-HERE]] · [[Current-State]]
