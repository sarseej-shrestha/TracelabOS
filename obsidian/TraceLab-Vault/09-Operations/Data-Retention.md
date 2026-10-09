# Data Retention

No automated retention job is implemented. Local SQLite persists until the developer explicitly removes the development data after stopping the app. Public hosting must implement short-lived demo spaces, image expiry, account deletion, and auditable cleanup before accepting uploads. TTLs should be enforced server-side and reconciled across DB and R2; a database row expiry must not leave orphaned photos.

Related: [[00-START-HERE]] · [[Current-State]]
