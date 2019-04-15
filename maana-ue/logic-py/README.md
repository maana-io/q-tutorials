# Maana Python Template

## Local Build & Deploy Simplified

In order to build the solution locally you will need docker and docker-compose.

To build the solution run:

```
docker-compose build
```

To deploy run:

```
docker-compose up
```

Back-end GraphQL endpoint will be available at http://localhost:8050/graphql

GraphIQL interface available at http://localhost:8050/graphiql

## Docker Compose Build

Docker-compose build will create images off of the instructions in the Docker files being pointed to.

These images will be the basis of the services that will be deployed.

Any time you make a change to the services you will need to rerun docker-compose build.

Docker caches the results of builds, so only the service or image that has changed will be rebuilt.

The first time you run this it might take some time, any time after will be quicker.

The base image contains all of the packages and pips that the project is dependent on as well as a template for a microservice. Since this changes rarely we don't want to rerun this frequently. Once it is run once it will only be rerun if the contents of docker_base change.

The service image is based off of the docker_base image. anything in docker_base can be modified and tailored to the service by adding the same filename to the service. All of the files in the service directory are copied over the files in the base directory and then server is started. This way, many services can use the same base image and have different resolvers, models, etc.

## Docker Compose Up

Docker-compose up brings up the built images as services.

## Azure Kubernetes Service Deployment Steps

### Prerequisites

1. Install Azure's AKS CLI
   `az aks install-cli`
2. Get credentials for the AKS cluster
   `az aks get-credentials --resource-group <RESOURCE_GROUP> --name <AKS_CLUSTER_NAME>`
3. Open the Kubernetes dashboard
   `az aks browse --resource-group <RESOURCE_GROUP> --name <AKS_CLUSTER_NAME>`
4. List deployed assets (Pods, deployments)
   `kubectl get all`

### Kubernetes Deployment

1. Create a name space in Kubernetes
   `kubectl create ns <NAMESPACE_FOR_YOUR_SERVICE>`
2. Apply docker-compose.yml file to the namespace
   kubectl apply -n <NAMESPACE_FOR_YOUR_SERVICE> -f <PATH_TO_DOCKER_COMPOSE>

### Expose your application

`kubectl expose deployment <DEPLOYMENT> --type=LoadBalancer --name=<NAME_FOR_EXPOSED_SERVICE> --namespace=<NAMESPACE_FOR_YOUR_SERVICE>`
