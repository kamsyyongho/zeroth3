#!/bin/bash
echo KEYCLOAK_URI=$KEYCLOAK_URL
echo KEYCLOAK_REALN=$KEYCLOAK_REALM
sed -i 's@REACT_APP_KEYCLOAK_URL@'"$KEYCLOAK_URL"'@' /usr/share/nginx/html/static/js/main.*.js
sed -i 's@REACT_APP_KEYCLOAK_REALM@'"$KEYCLOAK_REALM"'@' /usr/share/nginx/html/static/js/main.*.js
sed -i 's@REACT_APP_KEYCLOAK_CLIENT_ID@'"$KEYCLOAK_CLIENT_ID"'@' /usr/share/nginx/html/static/js/main.*.js
sed -i 's@REACT_APP_BACKEND_URL@'"$BACKEND_URL"'@' /usr/share/nginx/html/static/js/main.*.js
sed -i 's@REACT_APP_HOME_URL@'"$HOME_URL"'@' /usr/share/nginx/html/static/js/main.*.js
nginx -g "daemon off;"
