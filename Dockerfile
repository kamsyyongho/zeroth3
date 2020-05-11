FROM nginx:latest
EXPOSE 80
COPY dockerize/docker-entrypoint.sh /
ARG CACHEBUST=1
COPY build/ /usr/share/nginx/html/
ENTRYPOINT ["/docker-entrypoint.sh"]
