#!/bin/bash

image_name=zerhto-ee-bashboard
version=$(cat VERSION)
set -e

npm run build:docker

docker build -t $image_name:$version .

ECS_REPO=161969600347.dkr.ecr.ap-northeast-2.amazonaws.com/zeroth/zeroth-ee-dashboard
docker tag $image_name:$version $ECS_REPO:latest
docker tag $image_name:$version $ECS_REPO:$version
password=$(aws ecr get-login-password)
docker login --username AWS --password $password 161969600347.dkr.ecr.ap-northeast-2.amazonaws.com
docker push $ECS_REPO:latest
docker push $ECS_REPO:$version
