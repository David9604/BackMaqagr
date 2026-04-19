# Deploy Operations — GitHub Actions → Cloud Run

Este documento describe la operación del pipeline de despliegue automático hacia Cloud Run cuando hay cambios en la rama `deploy`.

## 1) Flujo de despliegue

- Trigger automático: `push` sobre rama `deploy`.
- Trigger manual: `workflow_dispatch` desde GitHub Actions.
- Autenticación: OIDC + Workload Identity Federation (WIF), **sin claves JSON**.
- Build: `Dockerfile` en raíz del repo.
- Publicación: Google Artifact Registry (GAR).
- Deploy: Cloud Run usando la imagen con tag inmutable `${GITHUB_SHA}`.

## 2) Variables requeridas en GitHub (Repository Variables)

Configurar en:
`GitHub → Settings → Secrets and variables → Actions → Variables`

Variables obligatorias:

| Variable | Ejemplo | Descripción |
|---|---|---|
| `GCP_PROJECT_ID` | `maqagr-143f3` | ID del proyecto GCP |
| `GCP_REGION` | `us-central1` | Región de Cloud Run |
| `CLOUD_RUN_SERVICE` | `maqagr-api` | Nombre del servicio Cloud Run |
| `GAR_REPOSITORY` | `maqagr-images` | Repositorio en Artifact Registry |
| `GAR_LOCATION` | `us-central1` | Ubicación de Artifact Registry |
| `WIF_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider` | Resource name del provider WIF |
| `WIF_SERVICE_ACCOUNT` | `github-deployer@maqagr-143f3.iam.gserviceaccount.com` | Service Account usada por GitHub Actions |

> El workflow valida estas variables al inicio y falla rápido si falta alguna.

## 3) Setup inicial de GCP Workload Identity Federation (one-time)

> Requisito: tener `gcloud` autenticado con permisos de admin IAM.

Definir variables locales para comandos:

```bash
PROJECT_ID="maqagr-143f3"
PROJECT_NUMBER="<YOUR_PROJECT_NUMBER>"
REGION="us-central1"

POOL_ID="github-pool"
PROVIDER_ID="github-provider"
SA_NAME="github-deployer"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

REPO_OWNER="<github-owner>"
REPO_NAME="BackMaqagr"
```

### 3.1 Crear Service Account para despliegues

```bash
gcloud iam service-accounts create "${SA_NAME}" \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions Cloud Run Deployer"
```

### 3.2 Roles mínimos para desplegar

```bash
# Push de imágenes a GAR
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Deploy/gestión de Cloud Run
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

# Permitir actuar como runtime service account en Cloud Run
# Reemplazar RUNTIME_SA_EMAIL si usás una SA runtime custom.
RUNTIME_SA_EMAIL="${SA_EMAIL}"
gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA_EMAIL}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

### 3.3 Crear Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "${POOL_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 3.4 Crear Provider OIDC de GitHub

```bash
gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_ID}" \
  --display-name="GitHub Actions Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='${REPO_OWNER}/${REPO_NAME}' && assertion.ref=='refs/heads/deploy'"
```

### 3.5 Permitir que GitHub impersonifique la Service Account

```bash
PRINCIPAL="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${REPO_OWNER}/${REPO_NAME}"

gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --member="${PRINCIPAL}" \
  --role="roles/iam.workloadIdentityUser"
```

### 3.6 Obtener resource name del provider para `WIF_PROVIDER`

```bash
gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_ID}" \
  --format="value(name)"
```

El output de ese comando se usa como valor de `WIF_PROVIDER`.

## 4) Recomendaciones de branch protection para `deploy`

Para gobernanza y seguridad, configurar:

- Require pull request before merging (evitar pushes directos)
- Required approvals (mínimo 1)
- Require status checks to pass (incluyendo tests y checks de seguridad)
- Restrict who can push to matching branches
- Block force pushes y branch deletions

Objetivo: que cada despliegue a producción tenga revisión y trazabilidad.

## 5) Rollback operativo

### Opción A — Re-deploy de imagen previa (recomendada)

1. Listar imágenes en GAR:

```bash
gcloud artifacts docker images list \
  "${GAR_LOCATION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GAR_REPOSITORY}/${CLOUD_RUN_SERVICE}" \
  --include-tags \
  --project="${GCP_PROJECT_ID}"
```

2. Elegir tag SHA previo o digest y desplegar:

```bash
# Con tag SHA
gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --image "${GAR_LOCATION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GAR_REPOSITORY}/${CLOUD_RUN_SERVICE}:<PREVIOUS_SHA>" \
  --region "${GCP_REGION}" \
  --project "${GCP_PROJECT_ID}"

# O con digest (inmutable)
gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --image "${GAR_LOCATION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GAR_REPOSITORY}/${CLOUD_RUN_SERVICE}@sha256:<DIGEST>" \
  --region "${GCP_REGION}" \
  --project "${GCP_PROJECT_ID}"
```

### Opción B — Revert en rama `deploy`

Hacer `git revert` del commit problemático sobre `deploy`. El revert dispara nuevamente el workflow y despliega una versión estable.

### Opción C — Rollback desde Cloud Run Console (revisión previa)

1. Ir a `Google Cloud Console → Cloud Run → Services → ${CLOUD_RUN_SERVICE}`.
2. Abrir la pestaña **Revisions** y ubicar la última revisión estable (previous revision).
3. Elegir una de estas acciones:
   - **Route traffic**: asignar 100% del tráfico a la revisión estable.
   - **Deploy revision** (o **Copy to new revision** según UI): re-publicar esa revisión como activa.
4. Verificar en la URL del servicio que la versión restaurada responde correctamente.
5. Registrar en el PR/incidente qué revisión quedó activa para trazabilidad.

## 6) Checklist de primera ejecución (validación operativa)

En el primer run, verificar:

1. ✅ Paso de validación de variables pasa sin errores.
2. ✅ Paso `auth` usa OIDC/WIF (sin lectura de claves JSON).
3. ✅ Docker login a `${GAR_LOCATION}-docker.pkg.dev` exitoso.
4. ✅ Imagen publicada con tag `${GITHUB_SHA}` y `latest`.
5. ✅ `gcloud run deploy` termina en éxito.
6. ✅ El summary muestra imagen desplegada, URL del servicio y revision.
7. ✅ La URL responde correctamente para health endpoint o endpoint base.

## 7) Política de seguridad

- **NO usar `GOOGLE_APPLICATION_CREDENTIALS` con key JSON** en este pipeline.
- **NO almacenar llaves JSON en GitHub Secrets** para este flujo.
- El mecanismo soportado es únicamente OIDC + WIF con tokens de vida corta.
