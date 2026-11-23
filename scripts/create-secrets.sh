#!/usr/bin/env bash
set -euo pipefail
NS="${LAB_NS:-lab}"
kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -
if kubectl -n "$NS" get secret lab-secrets >/dev/null 2>&1; then
echo "El secreto lab-secrets ya existe; no se modifica."
exit 0
fi
kubectl -n "$NS" create secret generic lab-secrets \
--from-literal=db-password="$(openssl rand -hex 16)" \
--from-literal=admin-password="$(openssl rand -hex 8)"
echo "Secreto creado. Para ver la contraseña de admin:"
echo "kubectl -n $NS get secret lab-secrets -o jsonpath='{.data.admin-password}' | base64 -d; echo"
