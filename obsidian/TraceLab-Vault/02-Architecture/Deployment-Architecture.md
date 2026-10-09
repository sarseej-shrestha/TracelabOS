# Deployment Architecture

No public deployment exists. The verified artifact is a Next.js production build. The current Node/SQLite runtime requires persistent local disk and cannot be deployed unchanged to Workers. Cloudflare compatibility research identifies vinext beta and OpenNext as paths to evaluate. Before hosting, implement PostgreSQL and R2 adapters, replace Node-only processing, run adapter compatibility and browser smoke tests, then provision free-tier resources with caps. See [[Hosting-Feasibility]].

Related: [[00-START-HERE]] · [[Current-State]]
