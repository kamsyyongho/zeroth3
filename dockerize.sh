#!/bin/bash

image_name=zerhto-ee-bashboard
version=$(cat VERSION)
set -e

docker build -t $image_name:$version .

ECS_REPO=161969600347.dkr.ecr.ap-northeast-2.amazonaws.com/zeroth/zeroth-ee-dashboard
docker tag $image_name:$version $ECS_REPO:latest
docker tag $image_name:$version $ECS_REPO:$version
#login_cmd_on_aws=$(aws ecr get-login --no-include-email)
#echo $login_cmd_on_aws | sh -x
#docker push $ECS_REPO:latest
#docker push $ECS_REPO:$version
