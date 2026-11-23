pipeline {
agent any
options {
timestamps()
disableConcurrentBuilds()
timeout(time: 20, unit: 'MINUTES')
}
environment {
IMAGE = 'le0ric/labapp'
TAG = "${env.BUILD_NUMBER}"
NS = 'lab'
KUBECONFIG = '/var/jenkins_home/.kube/config'
}
stages {
stage('Prueba') {
steps {
sh "docker build --target test -t labapp-test:${TAG} backend"
}
}
stage('Construir imagen') {
steps {
sh "docker build -t ${IMAGE}:${TAG} backend"
}
}
stage('Publicar imagen') {
steps {
withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
usernameVariable: 'DH_USER',
passwordVariable: 'DH_PASS')]) {
sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
sh "docker push ${IMAGE}:${TAG}"
}
}
}
stage('Desplegar') {
steps {
sh """
helm upgrade --install labapp chart \\
-n ${NS} \\
--set image.repository=${IMAGE} \\
--set image.tag=${TAG} \\
--atomic --wait --timeout 3m
"""
}
}
stage('Verificar') {
steps {sh 'curl -fsS http://localhost/health'
}
}
}
post {
always {
sh 'docker logout || true'
}
}
}
