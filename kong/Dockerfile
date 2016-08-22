FROM mashape/kong:0.8.3

COPY kong.yml /etc/kong/
RUN mkdir /etc/kong/ssl
COPY ssl/key.pem /etc/kong/ssl/
COPY ssl/cert.pem /etc/kong/ssl/
RUN chmod -R 600 /etc/kong/ssl

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 8000 8443 8001 7946
CMD ["kong", "start"]