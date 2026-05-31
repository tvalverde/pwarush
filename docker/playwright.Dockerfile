FROM mcr.microsoft.com/playwright:v1.60.0-noble

RUN apt-get update \
	&& apt-get install -y --no-install-recommends make \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /work
