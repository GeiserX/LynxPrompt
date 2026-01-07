import type {
  RepoHostOption,
  CiCdOption,
  LicenseOption,
  BranchStrategyOption,
  DeploymentTargetOption,
  ContainerRegistryOption,
  WizardOption,
} from "./types.js";

/**
 * Repository hosts
 */
export const REPO_HOSTS: RepoHostOption[] = [
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "gitlab", label: "GitLab", icon: "🦊" },
  { id: "gitea", label: "Gitea", icon: "🍵" },
  { id: "forgejo", label: "Forgejo", icon: "🔧" },
  { id: "bitbucket", label: "Bitbucket", icon: "🪣" },
  { id: "codeberg", label: "Codeberg", icon: "🏔️" },
  { id: "sourcehut", label: "SourceHut", icon: "📦" },
  { id: "gogs", label: "Gogs", icon: "🐙" },
  { id: "aws_codecommit", label: "AWS CodeCommit", icon: "☁️" },
  { id: "azure_devops", label: "Azure DevOps", icon: "☁️" },
  { id: "gerrit", label: "Gerrit", icon: "🔍" },
  { id: "phabricator", label: "Phabricator", icon: "📦" },
  { id: "other", label: "Other", icon: "📦" },
];

/**
 * CI/CD options
 */
export const CICD_OPTIONS: CiCdOption[] = [
  { id: "github_actions", label: "GitHub Actions", icon: "🐙" },
  { id: "gitlab_ci", label: "GitLab CI/CD", icon: "🦊" },
  { id: "jenkins", label: "Jenkins", icon: "🔧" },
  { id: "circleci", label: "CircleCI", icon: "🔵" },
  { id: "travis", label: "Travis CI", icon: "🔨" },
  { id: "azure_pipelines", label: "Azure Pipelines", icon: "☁️" },
  { id: "aws_codepipeline", label: "AWS CodePipeline", icon: "☁️" },
  { id: "gcp_cloudbuild", label: "GCP Cloud Build", icon: "☁️" },
  { id: "bitbucket_pipelines", label: "Bitbucket Pipelines", icon: "🪣" },
  { id: "teamcity", label: "TeamCity", icon: "🏢" },
  { id: "drone", label: "Drone CI", icon: "🚁" },
  { id: "buildkite", label: "Buildkite", icon: "🧱" },
  { id: "concourse", label: "Concourse CI", icon: "✈️" },
  { id: "woodpecker", label: "Woodpecker CI", icon: "🐦" },
  { id: "dagger", label: "Dagger", icon: "🗡️" },
  { id: "earthly", label: "Earthly", icon: "🌍" },
];

/**
 * Licenses
 */
export const LICENSES: LicenseOption[] = [
  { id: "mit", label: "MIT", description: "Permissive, simple" },
  { id: "apache-2.0", label: "Apache 2.0", description: "Permissive with patent grant" },
  { id: "gpl-3.0", label: "GPL 3.0", description: "Strong copyleft" },
  { id: "lgpl-3.0", label: "LGPL 3.0", description: "Weak copyleft" },
  { id: "agpl-3.0", label: "AGPL 3.0", description: "Network copyleft" },
  { id: "bsd-2", label: "BSD 2-Clause", description: "Permissive, simple" },
  { id: "bsd-3", label: "BSD 3-Clause", description: "Permissive, no endorsement" },
  { id: "mpl-2.0", label: "MPL 2.0", description: "File-level copyleft" },
  { id: "isc", label: "ISC", description: "Simple permissive" },
  { id: "unlicense", label: "Unlicense", description: "Public domain" },
  { id: "cc0", label: "CC0", description: "Public domain" },
  { id: "none", label: "None / Proprietary", description: "All rights reserved" },
  { id: "other", label: "Other", description: "Custom license" },
];

/**
 * Branch strategies
 */
export const BRANCH_STRATEGIES: BranchStrategyOption[] = [
  { id: "github_flow", label: "GitHub Flow", icon: "🌊", description: "Simple: main + feature branches" },
  { id: "gitflow", label: "Gitflow", icon: "🌳", description: "develop, feature, release, hotfix branches" },
  { id: "trunk_based", label: "Trunk-Based", icon: "🚂", description: "Short-lived branches, continuous integration" },
  { id: "gitlab_flow", label: "GitLab Flow", icon: "🦊", description: "Environment branches (staging, production)" },
  { id: "release_flow", label: "Release Flow", icon: "🚀", description: "Microsoft style: main + release branches" },
];

/**
 * Default branch names
 */
export const DEFAULT_BRANCHES: WizardOption[] = [
  { id: "main", label: "main" },
  { id: "master", label: "master" },
  { id: "develop", label: "develop" },
  { id: "trunk", label: "trunk" },
];

/**
 * Self-hosted deployment targets
 */
export const SELF_HOSTED_TARGETS: DeploymentTargetOption[] = [
  { id: "docker", label: "Docker", icon: "🐳", category: "self_hosted" },
  { id: "docker_compose", label: "Docker Compose", icon: "🐳", category: "self_hosted" },
  { id: "kubernetes", label: "Kubernetes", icon: "☸️", category: "self_hosted" },
  { id: "podman", label: "Podman", icon: "🦭", category: "self_hosted" },
  { id: "lxc", label: "LXC/LXD", icon: "📦", category: "self_hosted" },
  { id: "bare_metal", label: "Bare Metal", icon: "🖥️", category: "self_hosted" },
  { id: "vm", label: "Virtual Machine", icon: "💻", category: "self_hosted" },
  { id: "proxmox", label: "Proxmox", icon: "🔷", category: "self_hosted" },
  { id: "unraid", label: "Unraid", icon: "🟠", category: "self_hosted" },
  { id: "truenas", label: "TrueNAS", icon: "🔵", category: "self_hosted" },
  { id: "synology", label: "Synology NAS", icon: "📁", category: "self_hosted" },
  { id: "coolify", label: "Coolify", icon: "❄️", category: "self_hosted" },
  { id: "dokku", label: "Dokku", icon: "🐳", category: "self_hosted" },
  { id: "caprover", label: "CapRover", icon: "🚢", category: "self_hosted" },
  { id: "portainer", label: "Portainer", icon: "🐋", category: "self_hosted" },
  { id: "rancher", label: "Rancher", icon: "🐄", category: "self_hosted" },
  { id: "k3s", label: "K3s", icon: "☸️", category: "self_hosted" },
  { id: "microk8s", label: "MicroK8s", icon: "☸️", category: "self_hosted" },
  { id: "nomad", label: "Nomad", icon: "🏕️", category: "self_hosted" },
];

/**
 * Cloud deployment targets
 */
export const CLOUD_TARGETS: DeploymentTargetOption[] = [
  { id: "vercel", label: "Vercel", icon: "▲", category: "cloud" },
  { id: "netlify", label: "Netlify", icon: "🌐", category: "cloud" },
  { id: "cloudflare_pages", label: "Cloudflare Pages", icon: "🔶", category: "cloud" },
  { id: "cloudflare_workers", label: "Cloudflare Workers", icon: "🔶", category: "cloud" },
  { id: "aws_lambda", label: "AWS Lambda", icon: "☁️", category: "cloud" },
  { id: "aws_ecs", label: "AWS ECS", icon: "☁️", category: "cloud" },
  { id: "aws_eks", label: "AWS EKS", icon: "☁️", category: "cloud" },
  { id: "aws_ec2", label: "AWS EC2", icon: "☁️", category: "cloud" },
  { id: "aws_lightsail", label: "AWS Lightsail", icon: "☁️", category: "cloud" },
  { id: "aws_amplify", label: "AWS Amplify", icon: "☁️", category: "cloud" },
  { id: "gcp_cloudrun", label: "GCP Cloud Run", icon: "🌈", category: "cloud" },
  { id: "gcp_gke", label: "GCP GKE", icon: "🌈", category: "cloud" },
  { id: "gcp_appengine", label: "GCP App Engine", icon: "🌈", category: "cloud" },
  { id: "gcp_functions", label: "GCP Cloud Functions", icon: "🌈", category: "cloud" },
  { id: "azure_functions", label: "Azure Functions", icon: "🔷", category: "cloud" },
  { id: "azure_aks", label: "Azure AKS", icon: "🔷", category: "cloud" },
  { id: "azure_container", label: "Azure Container Apps", icon: "🔷", category: "cloud" },
  { id: "azure_appservice", label: "Azure App Service", icon: "🔷", category: "cloud" },
  { id: "railway", label: "Railway", icon: "🚂", category: "cloud" },
  { id: "render", label: "Render", icon: "🎨", category: "cloud" },
  { id: "fly", label: "Fly.io", icon: "✈️", category: "cloud" },
  { id: "digitalocean_app", label: "DigitalOcean App Platform", icon: "🔵", category: "cloud" },
  { id: "digitalocean_droplet", label: "DigitalOcean Droplet", icon: "🔵", category: "cloud" },
  { id: "heroku", label: "Heroku", icon: "🟣", category: "cloud" },
  { id: "deno_deploy", label: "Deno Deploy", icon: "🦕", category: "cloud" },
  { id: "supabase_edge", label: "Supabase Edge Functions", icon: "⚡", category: "cloud" },
];

/**
 * All deployment targets
 */
export const DEPLOYMENT_TARGETS: DeploymentTargetOption[] = [...SELF_HOSTED_TARGETS, ...CLOUD_TARGETS];

/**
 * Container registries
 */
export const CONTAINER_REGISTRIES: ContainerRegistryOption[] = [
  { id: "dockerhub", label: "Docker Hub", icon: "🐳" },
  { id: "ghcr", label: "GitHub Container Registry", icon: "🐙" },
  { id: "gcr", label: "Google Container Registry", icon: "🌈" },
  { id: "ecr", label: "AWS ECR", icon: "☁️" },
  { id: "acr", label: "Azure Container Registry", icon: "🔷" },
  { id: "quay", label: "Quay.io", icon: "🔴" },
  { id: "gitlab_registry", label: "GitLab Container Registry", icon: "🦊" },
  { id: "harbor", label: "Harbor", icon: "🚢" },
  { id: "self_hosted", label: "Self-hosted Registry", icon: "🏠" },
];

