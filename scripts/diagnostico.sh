#!/usr/bin/env bash
NS="${LAB_NS:-lab}"
echo "=== Reloj ==="; date; timedatectl status | grep -E "synchronized|Local time"
echo "=== Nodos ==="; kubectl get nodes -o wide
echo "=== Pods ($NS) ==="; kubectl -n "$NS" get pods -o wide
echo "=== Servicios e Ingress ($NS) ==="; kubectl -n "$NS" get svc,ingress
echo "=== Helm ($NS) ==="; helm list -n "$NS"; helm history labapp -n "$NS" 2>&1 | tail -n 5
echo "=== Eventos recientes ($NS) ==="; kubectl -n "$NS" get events
--sort-by=.metadata.creationTimestamp 2>&1 | tail -n 20
echo "=== Logs backend ==="; kubectl -n "$NS" logs deploy/labapp-backend --tail=40 2>&1
echo "=== Logs postgres ==="; kubectl -n "$NS" logs deploy/labapp-postgres --tail=20 2>&1
echo "=== Jenkins ==="; docker ps -a --filter name=jenkins --format '{{.Names}} {{.Status}}'
docker logs jenkins --tail=20 2>&1
