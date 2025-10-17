FROM php:8.1-cli


RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       git zip unzip \
       libzip-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer


WORKDIR /app


COPY composer.json composer.lock ./


RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist


COPY . /app


ENV PORT=8080
EXPOSE 8080


CMD ["php", "src/RunServerWebSocket/run-server.php"]
