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
? Endpoint URL (Enter to skip): https://<maana host>:8443/graphql
? Name of this endpoint, for e.g. default, dev, prod: (default)
? Subscription URL (Enter to skip):
? Do you want to add other endpoints? No
? What format do you want to save your config in? JSON

About to write to /home/me/maana/training/.graphqlconfig:

{
  "projects": {
    "ckg": {
      "schemaPath": "ckg.graphql",
      "extensions": {
        "endpoints": {
          "default": "https://<maana host>:8443/graphql"
        }
      }
    }
  }
}

? Is this ok? Yes
```

## Authentication with Maana

Maana endpoints require a valid (authenticated) user in order to prevent unauthorized access.

### <a name="v3.1.0"></a>Maana Q v3.1.0 and later

After creating a new `.graphqlconfig` file connecting to a Maana API endpoint:
* Login to the Maana Knowledge Portal
* Click on your user icon and select your profile
* At the bottom of the profile page click the 'Get CLI Authentication Token' button
* Go through the login process (again)
* Copy the generated auth token that shows up below the button
* In the terminal run `gql msignin` and when asked paste the Authentication Token into the prompt
* Run `gql menv --shell <your shell>` in the current terminal window to run authenticated GraphQL calls.
  - Example: Run `gql menv --shell bash` if you are using bash
  - You will see output similar to:
    ```
    export MAANA_AUTH_TOKEN=<token here>
    # Run this command to configure your shell
    # eval $(gql menv --shell bash)
    ```
  - Now run `eval $(gql menv --shell bash)` like it asks you at the bottom of the output
* Run `gql ping` to test out that the authentication works (you will get an error if it did not)

#### Additional Notes

* When you add another project to your `.graphqlconfig` file you can run `gql maddheaders --project <Project Name>` to add the headers to the new project.
* When you want to run the CLI against the Maana API in a different terminal window you will need to run `gql env` again.
* If your authentication token expires you can run `gql mrefreshauth` to refresh the authentication token, when the Maana API is configured to allow the refreshing of authentication tokens.

### <a name="v3.0.5"></a>Maana Q v3.0.5

After creating a new project connecting to a Maana endpoint, you will need to setup the project to add an authentication header to the requests.

* Login to the Maana Knowledge Portal
* Click on your user icon and select your profile
* At the bottom of the profile page click the 'Get CLI Authentication Token' button
* Go through the login process (again)
* Copy the generated auth token that shows up below the button
* In the terminal add an environment variable for the auth token

```sh
# *nix based systems
export MAANA_AUTH_TOKEN=<paste auth token here>
```

```bat
rem Windows command line
set MAANA_AUTH_TOKEN=<paste auth token here>
```

```ps1
# Windows power shell
$Env:MAANA_AUTH_TOKEN = "<paste auth token here>"
```

Add the authorization header to the Maana endpoint:

```diff
     "ckg": {
      "schemaPath": "ckg.graphql",
       "extensions": {
         "endpoints": {
-           "default": "https://<maana host>:8443/graphql"
+           "default": {
+             "url": "https://<maana host>:8443/graphql",
+             "headers": {
+               "Authorization": "Bearer ${env:MAANA_AUTH_TOKEN}"
+             }
+           }
         }
       }
     }
```

## Create the Service

The domain model for the tutorial has already been created: `model.gql`. This GraphQL SDL file contains only the types we care about: Well, Location, DrillingReport, DrillingProblem, ...

We would like to have Maana completely manage these types, creating the boilerplate queries, mutations, and subscriptions covering the basic CRUD (Create, Read, Update, Delete) operations.

We can use the GraphQL CLI with the Maana plugin command: `maddsvc` ("add service"):

```bash
gql maddsvc "Drillng Problems" -s model.gql -p ckg
Using endpoint default: {"url":"https://<maana host>:8443/graphql"}
Read file: model.gql size: 483
Sending query:

      mutation addServiceSource($input: AddServiceSourceInput!) {
        addServiceSource(input: $input)
      }

✔ Call succeeded:
{"addServiceSource":"50d759d5-983d-4ea2-9773-20077c9b823e"}
```

Take note of the generated service id, since we&#39;ll add it as a new GraphQL **endpoint** to your CLI configuration.

## Update the Config

Add another project to you graphql config using the following template to build your service url. Make sure that your url ends in `/graphql`.

Template:
```
https://<maana host>:8443/service/<service id>/graphql
```

Command:
```bash
gql add-project
? Enter project name for new project: db
? Local schema file path: data/schema.graphql
? Endpoint URL (Enter to skip): <service url>
? Name of this endpoint, for e.g. default, dev, prod: (default)
? Subscription URL (Enter to skip):
? Do you want to add other endpoints? No

About to write new configuration to ~/maana/q-tutorials/drill_prob/.graphqlconfig:

{
  "projects": {
    "ckg": {
      "schemaPath": "ckg.graphql",
      ...
    },
    ...
  }
}

? Is this ok? Yes
```

Again, we need to add the authorization header.
* In Maana Q 3.1.0 or later just run the `gql maddheaders` command
* In Maana Q 3.0.5 will require adding it manually, check [here](#v3.0.5) for instructions.

## Introspecting the Service

Only a few types were specified for the **domain model**. Maana adds a set of boilerplate types and operations as part of a fully-managed service. The **schema** for this service can be retrieved by:

```bash
gql get-schema -p db
```

## Loading Instance Data

Now that the model has been turned into a service, we can upload instance data to populate ("hydrate") the graph:

```bash
gql mload data/DrillingProblem.csv -p db
gql mload data/Location.csv -p db
gql mload data/DrillingReport.csv -p db
gql mload data/Well.csv -p db
```

For convenience, these steps have been added to a script file: `loadData.sh`
