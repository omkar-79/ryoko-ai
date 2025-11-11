#!/bin/sh
# Handle PORT environment variable for Cloud Run
PORT=${PORT:-8080}

# Update nginx config to use the PORT from environment (Alpine sed syntax)
sed -i "s/listen 8080/listen $PORT/g" /etc/nginx/conf.d/default.conf || \
sed -i.bak "s/listen 8080/listen $PORT/g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"

