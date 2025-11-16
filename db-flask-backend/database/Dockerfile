FROM mysql:8.0.28

COPY database/my.cnf /etc/mysql/

RUN apt-get update && \
    apt-get install --yes \
    openssl && \
    mkdir /certs

COPY database/certs/* /certs/

RUN chmod 444 /certs/* && \
    chmod 400 /certs/*key.pem && \
    chown mysql:mysql /certs/*.pem
