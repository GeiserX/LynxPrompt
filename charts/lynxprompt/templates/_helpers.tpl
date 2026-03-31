{{/*
Expand the name of the chart.
*/}}
{{- define "lynxprompt.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "lynxprompt.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "lynxprompt.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "lynxprompt.labels" -}}
helm.sh/chart: {{ include "lynxprompt.chart" . }}
{{ include "lynxprompt.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "lynxprompt.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lynxprompt.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels for the web deployment.
*/}}
{{- define "lynxprompt.webSelectorLabels" -}}
{{ include "lynxprompt.selectorLabels" . }}
app.kubernetes.io/component: web
{{- end }}

{{/*
Selector labels for PostgreSQL.
*/}}
{{- define "lynxprompt.postgresqlSelectorLabels" -}}
{{ include "lynxprompt.selectorLabels" . }}
app.kubernetes.io/component: postgresql
{{- end }}

{{/*
Return the PostgreSQL host.
*/}}
{{- define "lynxprompt.postgresql.host" -}}
{{- if .Values.postgresql.enabled -}}
{{- include "lynxprompt.fullname" . }}-postgresql
{{- else -}}
{{- .Values.externalDatabase.host -}}
{{- end -}}
{{- end -}}

{{/*
Return the PostgreSQL port.
*/}}
{{- define "lynxprompt.postgresql.port" -}}
{{- if .Values.postgresql.enabled -}}
5432
{{- else -}}
{{- .Values.externalDatabase.port -}}
{{- end -}}
{{- end -}}

{{/*
Return the PostgreSQL user.
*/}}
{{- define "lynxprompt.postgresql.user" -}}
{{- if .Values.postgresql.enabled -}}
{{- .Values.postgresql.auth.username -}}
{{- else -}}
{{- .Values.externalDatabase.user -}}
{{- end -}}
{{- end -}}

{{/*
Return the PostgreSQL database name.
*/}}
{{- define "lynxprompt.postgresql.database" -}}
{{- if .Values.postgresql.enabled -}}
{{- .Values.postgresql.auth.database -}}
{{- else -}}
{{- .Values.externalDatabase.database -}}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "lynxprompt.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "lynxprompt.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Secret name for application credentials.
*/}}
{{- define "lynxprompt.secretName" -}}
{{- if .Values.auth.existingSecret -}}
{{- .Values.auth.existingSecret -}}
{{- else -}}
{{- include "lynxprompt.fullname" . -}}
{{- end -}}
{{- end }}
