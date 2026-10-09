# ADR-0006 — Private object storage

Status: implemented and locally verified; live R2 credentials absent. Date: 2026-10-08.

Use the AWS S3 client (3.1148.0) against R2's S3-compatible HTTPS endpoint with region auto. Bucket access must remain private. The application never emits public or presigned image URLs: each read passes session and object-level authorization. Decode/signature/size checks and JPEG normalization occur before upload. Record an immutable random object key, size and SHA-256 in image_references; verify the digest before returning bytes. Provider errors become a generic 503 without exposing credentials. Partial configuration fails closed. Existing database image bytes remain readable.

Database and object storage cannot share one atomic transaction. Upload a new immutable object, then commit the reference. Keep the previous object until reconciliation; a failed commit may leave an orphan but does not erase the prior image. The bounded reconciliation command defaults to dry-run, considers only the application prefix and objects older than 24 hours, and checks current references inside a write transaction before deletion. Schedule it explicitly after live validation. No deletion was executed against R2.

`pnpm images:migrate` previews up to 100 database images; `--apply` uploads them and deletes each source row only within its successful reference transaction. `pnpm images:reconcile` previews orphan candidates; `--delete` enables deletion. Both require explicit database selection and complete R2 configuration. Keep backup copies until hosted browser validation succeeds.

Local tests cover signed S3 HTTP transport using a local protocol fixture, API authorization, bad uploads, corrupt/missing objects, provider/database failures, import preservation and reconciliation on SQLite/PostgreSQL. These are not live R2 performance or availability measurements. Request transactions currently span bounded object I/O; this limits throughput and should be replaced by durable jobs for larger workloads.

Sources: [Cloudflare S3 SDK example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/), [R2 S3 setup](https://developers.cloudflare.com/r2/get-started/s3/). Related: [[Database-Architecture]], [[Security-Engineering]], [[Current-State]].
