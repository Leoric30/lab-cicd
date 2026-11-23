FROM jenkins/jenkins:lts-jdk17
USER root
RUN apt-get update \
&& apt-get install -y docker.io \
&& curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash \
&& rm -rf /var/lib/apt/lists/*
USER jenkins
