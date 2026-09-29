# Getting started

## Docker Compose

```bash
# 1. Create a .env file
cat > .env <<EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -hex 24)
ADMIN_EMAIL=your@email.com
APP_URL=http://localhost:3000
EOF

# 2. Download the self-host compose file and start LynxPrompt
curl -O https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docker-compose.selfhost.yml
docker compose -f docker-compose.selfhost.yml up -d

# 3. Open http://localhost:3000
```

That's it. LynxPrompt is running with PostgreSQL, automatic migrations, and email authentication enabled by default.

## Helm chart (Kubernetes)

A Helm chart is also available for Kubernetes deployments. See the [chart documentation](https://github.com/GeiserX/LynxPrompt/blob/main/charts/lynxprompt/README.md) for the full values reference.

```bash
helm repo add lynxprompt https://geiserx.github.io/LynxPrompt
helm install lynxprompt lynxprompt/lynxprompt
```

## Install channels

LynxPrompt and its tools are published here:

<p align="center">
  <a href="https://lynxprompt.com"><img src="https://img.shields.io/badge/🌐_Website-lynxprompt.com-6366f1?style=flat-square" alt="Website"></a>
  <a href="https://www.npmjs.com/package/lynxprompt"><img src="https://img.shields.io/npm/v/lynxprompt?style=flat-square&logo=npm&label=CLI" alt="npm"></a>
  <a href="https://community.chocolatey.org/packages/lynxprompt"><img src="https://img.shields.io/chocolatey/v/lynxprompt?style=flat-square&logo=chocolatey&label=Chocolatey" alt="Chocolatey"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=LynxPrompt.lynxprompt"><img src="https://img.shields.io/badge/VS_Code-Extension-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code Extension"></a>
  <a href="https://github.com/GeiserX/LynxPrompt/blob/main/LICENSE"><img src="https://img.shields.io/github/license/GeiserX/LynxPrompt?style=flat-square" alt="License"></a>
  <a href="https://github.com/GeiserX/LynxPrompt"><img src="https://img.shields.io/github/stars/GeiserX/LynxPrompt?style=flat-square&logo=github" alt="GitHub Stars"></a>
  <a href="https://hub.docker.com/r/drumsergio/lynxprompt"><img src="https://img.shields.io/docker/pulls/drumsergio/lynxprompt?style=flat-square&logo=docker&label=Docker%20Pulls" alt="Docker Pulls"></a>
  <a href="https://artifacthub.io/packages/helm/lynxprompt/lynxprompt"><img src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/lynxprompt&style=flat-square" alt="ArtifactHub"></a>
  <a href="https://github.com/GeiserX/lynxprompt-action"><img src="https://img.shields.io/badge/GitHub_Action-v1-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="GitHub Action"></a>
  <a href="https://aur.archlinux.org/packages/lynxprompt"><img src="https://img.shields.io/aur/version/lynxprompt?style=flat-square&logo=archlinux&label=AUR" alt="AUR"></a>
  <a href="https://snapcraft.io/lynxprompt"><img src="https://snapcraft.io/lynxprompt/badge.svg" alt="Snap"></a>
  <a href="https://codecov.io/gh/GeiserX/LynxPrompt"><img src="https://codecov.io/gh/GeiserX/LynxPrompt/graph/badge.svg" alt="codecov"></a>
</p>
