# Drilling Problems

In this tutorial, we will walk step-by-step for creating a managed graph from a GraphQL definition, loading it with data, adding custom services, and building a knowledge application.

## Installation

We use the GraphQL command line interface (CLI) with the Maana plugin:

npm i -g graphql-cli graphql-cli-maana

## Setup

We have included a `.graphqlconfig` file preconfigured for this tutorial.

**Minimally, ensure the endpoint is correct for the Maana endpoint you are using**

**Optionally**, to create a configuration from scratch, create a CKG project and GraphQL endpoint, as in:

```bash
gql init
? Enter project name (Enter to skip): ckg
? Local schema file path: ckg.graphql
? Endpoint URL (Enter to skip): http://qtraining01.knowledge.maana.io:8003/graphql
? Name of this endpoint, for e.g. default, dev, prod: (default)
? Subscription URL (Enter to skip):
? Do you want to add other endpoints? No
? What format do you want to save your config in? JSON

About to write to /home/dthompson/src/maana/scratch/.graphqlconfig:

{
  "projects": {
    "ckg": {
      "schemaPath": "ckg.graphql",
      "extensions": {
        "endpoints": {
          "default": "http://qtraining01.knowledge.maana.io:8003/graphql"
        }
      }
    }
  }
}

? Is this ok? Yes
```

## Create the Service

The domain model for the tutorial has already been created: `model.gql`. This GraphQL SDL file contains only the types we care about: Well, Location, DrillingReport, DrillingProblem, ...

We would like to have Maana completely manage these types, creating the boilerplate queries, mutations, and subscriptions covering the basic CRUD (Create, Read, Update, Delete) operations.

We can use the GraphQL CLI with the Maana plugin command: `maddsvc` ("add service"):

```bash
gql maddsvc "Drillng Problems" -s model.gql -p ckg
Using endpoint default: {"url":"http://qtraining01.knowledge.maana.io:8003/graphql"}
Read file: model.gql size: 483
Sending query:

      mutation addServiceSource($input: AddServiceSourceInput!) {
        addServiceSource(input: $input)
      }

✔ Call succeeded:
{"addServiceSource":"50d759d5-983d-4ea2-9773-20077c9b823e"}
```

## Update the Config

The included `.graphqlconfig` already contains a project, `dp`, that specified the schema file and endpoint for this service. However, the service ID needs to be updated to match the output from adding the service (above):

```diff
     "dp": {
      "schemaPath": "dp.graphql",
       "extensions": {
         "endpoints": {
-          "default": "http://qtraining01.knowledge.maana.io:8003/service/051850b1-f088-46b1-8e35-679f5d2ac84f/graphql"
+          "default": "http://qtraining01.knowledge.maana.io:8003/service/50d759d5-983d-4ea2-9773-20077c9b823e/graphql"
         }
       }
     }
```

**Optionally**, to create this project from scratch:

```bash
gql add-project
? Enter project name for new project: dp
? Local schema file path: dp.graphql
? Endpoint URL (Enter to skip): http://qtraining01.knowledge.maana.io:8003/service/1788c00e-3a29-4843-aa56-44ba374cf682/graphql
? Name of this endpoint, for e.g. default, dev, prod: (default)
? Subscription URL (Enter to skip):
? Do you want to add other endpoints? No

Adding the following endpoints to your config:  dp
? Is this ok? Yes
```

## Introspecting the Service

Only a few types were specified for the **domain model**. Maana adds a set of boilerplate types and operations as part of a fully-managed service. The **schema** for this service can be retrieved by:

```bash
gql get-schema -p dp
```

## Loading Instance Data

Now that the model has been turned into a service, we can upload instance data to populate ("hydrate") the graph:

```bash
gql mload -p dp -c data/DrillingProblem.csv -m addDrillingProblems
gql mload -p dp -c data/DrillingReport.csv -m addDrillingReports
gql mload -p dp -c data/Location.csv -m addLocations
gql mload -p dp -c data/Well.csv -m addWells
```

For convenience, these steps have been added to a script file: `loadData.sh`
