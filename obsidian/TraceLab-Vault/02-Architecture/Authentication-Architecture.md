# Authentication Architecture

Local accounts use fictional usernames and scrypt password hashes with random salts. Sessions use 32-byte random tokens; only SHA-256 token hashes are stored. Cookies are HttpOnly, SameSite=Strict, path=/, and Secure on HTTPS; expiry is eight hours. Demo accounts cannot log in with passwords and role switching is limited to the current demo space. Self-selected teacher roles are for local development, not institutional authorization. Password recovery, distributed rate limiting, and institutional identity are pending.

Related: [[00-START-HERE]] · [[Current-State]]
