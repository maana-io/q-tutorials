# Getting started

## Prerequisits

1.  You need to have Lerna installed on your machine.

        npm install --global lerna

2.  You need to have a running instance of [Prisma](https://www.prisma.io/docs/1.16/get-started/01-setting-up-prisma-new-database-a002/#goals). You can point it to either a remote or local instance of Prisma. This template assumes you have set [your own local Prisma instance.](https://www.prisma.io/docs/1.16/get-started/01-setting-up-prisma-new-database-a002/#set-up-database-and-prisma-server)

## Change the working directory

From the path `q-tutorials` was cloned into, run

    cd claroil/well-opportunity/application

## Install all dependencies

In the `application` folder, run the following:

    lerna bootstrap

## Create an .env file

1.  In the `application/packages/logic` folder run the following:

        touch .env

2.  In your favorite editor, edit the contents of the `.env` file.

        # Identity
        SERVICE_ID='io.maana.demo'
        PORT=4000

        # Peer/remote GraphQL services used
        REMOTE_KSVC_ENDPOINT_URL='[WORKSPACE_SERVICE_URL]'
        # Auth
        MACHINE_TO_MACHINE_APP_AUTH_DOMAIN='maana-sales.auth0.com'
        MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID='[AUTH_CLIENT_ID]'
        MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET='[AUTH_CLIENT_SECRET]'
        MACHINE_TO_MACHINE_APP_AUTH_IDENTIFIER='https://h4.maana.io/'

        # PubSub configuration
        RABBITMQ_ADDR='127.0.0.1'
        RABBITMQ_PORT=5672

        PUBLICNAME=localhost

## Run the logic and model services

In the `application/packages/logic` folder run the following:

    npm run start

Navigate to `https://localhost:4000` to inspect the GraphQL endpoint you created.

# Deploying the Logic service

## Prerequisits

You need to have Docker installed and running on your machine.

## Change the working directory

From `application/packages`

    cd

## Log into the Azure Container Registery

    docker login --username [USER_NAME] --password [PASSWORD] [ACR_NAME].azurecr.io

## Build and tag the Docker image

    docker build --tag=[ACR_NAME].azurecr.io/[APP_NAME]:[VERSION]

Make sure you assign a _unique_ name and version to your image.

## Push your image into ACR

    docker push [ACR_NAME].azurecr.io/[APP_NAME]:[VERSION]

## Run an instance of your application

1. In the ACR interface in the Azure Portal, click on `Reposetories`
2. Click on the name of your image. The version tag of your image will appear.
3. Click on the elipses (...) on the right side of the version tag.
4. Click on "Run Instance"
5. Provide the required information to spin up the instance. You'll be required to provide a name, resource group and port. The port should match the one used in your Dockerfile (4000)
