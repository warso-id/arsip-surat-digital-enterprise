#!/bin/bash

# Generate SSL certificates for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout localhost.key \
    -out localhost.crt \
    -config openssl.cnf

echo "SSL certificates generated successfully"
