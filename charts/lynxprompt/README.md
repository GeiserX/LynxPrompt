# LynxPrompt Helm Chart

This chart deploys the LynxPrompt web application and an optional bundled PostgreSQL instance.

## What It Supports

- LynxPrompt web app on a single Deployment
- Optional bundled PostgreSQL StatefulSet
- Ingress for browser access
- Reusable or chart-managed Secret for auth and database credentials
- Uploads PVC for blog/media assets

## Important Operational Notes

- The container entrypoint runs `prisma db push` for all four LynxPrompt databases on startup.
- The default chart uses `replicaCount: 1` because:
  - uploads default to a `ReadWriteOnce` PVC
  - concurrent pod starts all run `db push`
- If you want multiple replicas, use shared/object storage for uploads and move schema management outside normal pod startup.
- If `postgresql.enabled=false`, set the external database coordinates in `externalDatabase.*` and provide `db-password` via `auth.existingSecret` or `externalDatabase.password`.
- The chart uses Helm `lookup` to preserve generated secrets on upgrade. For GitOps or `helm template` workflows, prefer `auth.existingSecret` so renders stay deterministic.

## Secrets

Set `auth.existingSecret` to reuse a pre-created Secret, or let the chart manage one.

Expected keys in the Secret:

- `nextauth-secret`
- `db-password`
- optional: `github-client-secret`
- optional: `google-client-secret`
- optional: `smtp-password`
- optional: `anthropic-api-key`
- optional: `turnstile-secret-key`

## Minimal Example

```yaml
auth:
  superadminEmail: admin@example.com

app:
  url: https://lynxprompt.example.com
  enableGithubOauth: "true"

oauth:
  github:
    clientId: your-client-id
    clientSecret: your-client-secret

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: lynxprompt.example.com
      paths:
        - path: /
          pathType: Prefix
```

Install with:

```bash
helm upgrade --install lynxprompt ./charts/lynxprompt -f my-values.yaml
```

## Useful Values

- `auth.existingSecret`: reuse credentials from an External Secret or Sealed Secret
- `waitForDatabase.enabled`: block app startup until PostgreSQL accepts TCP connections
- `waitForDatabase.timeoutSeconds`: fail startup if the database never becomes reachable instead of looping forever
- `externalDatabase.*`: required when you disable the bundled PostgreSQL
- `persistence.uploads.existingClaim`: reuse an uploads PVC instead of creating one
- `app.enableFederation` and `app.federationRegistryUrl`: configure instance federation
- `extraEnv` / `extraEnvFrom`: inject less common runtime options without forking templates
