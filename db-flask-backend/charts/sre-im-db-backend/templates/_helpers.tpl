{{/* vim: set filetype=mustache: */}}

{{/*
For more information in 63 characters rule see:
https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names
*/}}

{{/*
Define common labels
*/}}

{{- define "common.labels" -}}
app.kubernetes.io/managed-by: helm
app.kubernetes.io/version: {{ .Chart.Version }}
environment: {{ .Values.config.environment }}
owner: {{ .Values.config.owner }}
platform: {{ .Values.config.platform }}
{{- end -}}

{{/*
Define deployment match labels
*/}}
{{- define "application.matchLabels" -}}
app.kubernetes.io/name: {{ include "application.name" . }}
app.kubernetes.io/component: application
{{- end -}}

{{/*
Define fully qualified application name
*/}}

{{- define "application.name" -}}
{{- printf "%s" .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Define deployment labels
*/}}

{{- define "application.labels" -}}
app.kubernetes.io/name: {{ include "application.name" . }}
app.kubernetes.io/component: application
component: application
{{ include "common.labels" . }}
{{- end -}}

{{/*
Define fully qualified application config name
*/}}

{{- define "application-config.name" -}}
{{- printf "%s-%s" (include "application.name" .) "application-config" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Define application config labels
*/}}

{{- define "application-config.labels" -}}
app.kubernetes.io/name: {{ include "application-config.name" . }}
app.kubernetes.io/component: application
component: application
{{ include "common.labels" . }}
{{- end -}}

{{/*
Define fully qualified service ingress name
*/}}

{{- define "ingress.name" -}}
{{- printf "%s-%s" (include "application.name" .) "ingress" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Define fully qualified internal nginx ingress name
*/}}

{{- define "internal-nginx-ingress.name" -}}
{{- printf "%s-%s" (include "application.name" .) "internal-nginx-ingress" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Define internal nginx ingress labels
*/}}

{{- define "internal-nginx-ingress.labels" -}}
app.kubernetes.io/name: {{ include "internal-nginx-ingress.name" . }}
app.kubernetes.io/component: internal-nginx-ingress
{{ include "common.labels" . }}
{{- end -}}
