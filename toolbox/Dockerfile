FROM node:14-alpine

ENV AWS_REGION=eu-central-1

# Install packages
RUN apk update && apk add --update --no-cache \
    git \
    bash \
    curl \
    openssh \
    python3 \
    py3-pip \
    py-cryptography \
    vim \
    wget \
    packer \
    curl

RUN apk --no-cache add --virtual builds-deps build-base python3

# Install AWSCLI
RUN pip install --upgrade pip && \
    pip install --upgrade awscli

ADD packer /opt/packer-build/
