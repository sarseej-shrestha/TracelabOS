# Coding Conventions

Use discriminated unions for mathematical types and explicit Zod objects at boundaries. Return UNSUPPORTED or review outcomes when proof is unavailable. Prefer exact Rational arithmetic to floating-point comparisons. Keep migrations and evaluator versions explicit. Avoid input eval, dynamic SQL identifiers from requests, or secrets in logs. Dependency versions are pinned and require an online vulnerability audit before deployment.

Related: [[00-START-HERE]] · [[Current-State]]
