#!/bin/bash
echo $KEYCLOAK_URI
sed -i 's/13.125.20.108:8080/'"$KEYCLOAK_URI"'/' /usr/share/nginx/html/static/js/main.*.js
nginx -g "daemon off;"
