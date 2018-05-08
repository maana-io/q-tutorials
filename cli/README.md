# Maana Command Line Interface (CLI)

Here is a step-by-step example of an end-to-end flow of creating a domain model, hydrating it with instances, and querying it, all programmatically, using the standard [graphql-cli ](https://github.com/graphql-cli/graphql-cli)utility and the custom Maana plugin.

Sample code can be found here: [https://github.com/maana-io/Q-tutorials/tree/master/cli](https://github.com/maana-io/Q-tutorials/tree/master/cli).

It is published as an [NPM package](https://www.npmjs.com/package/graphql-cli-maana).

It is best to make a copy of this repo (delete the .git folder to detach it from GitHub). Then you can make all the changes you want, check it into a different repo, etc.

## Installation

npm i -g graphql-cli graphql-cli-maana

## Setup

The CLI uses a [standard configuration format](https://github.com/graphcool/graphql-config/blob/master/specification.md), .graphqlconfig. The purpose is to provide configurations for the CLI tool.

The tutorial repo you cloned above includes a sample .graphqlconfig. It might be easier to edit it, but, if you wish, you can create your own by (deleting it and) following the instructions below.

The config consists of:

* **projects** : these are equivalent to Maana "service name" and tell the CLI where to find the schema for the endpoint
* **endpoints** : these are the "service endpoint URLs"

For consistency and simplicity, we recommend you use the same name for the **Maana service** , the **project** , and the **endpoint** (e.g., "ckg", "basic", "projectX").

To create a configuration from scratch, create a CKG project and GraphQL endpoint, as in:

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

## Create the Model

Let's first define a simple schema to use, e.g., model.gql:

```graphql
type Person {
  id: ID!
  name: String!
  dob: String
  employer: Employer
}

type Employer {
  id: ID!
  name: String!
  ceo: Person
}
```

## Create the Service

Now that we've defined our model, we would like Maana to manage it for us (i.e., create a graph and all of the boilerplate operations, such as add, updating, and deleting instances, querying them, generating events, etc.).

Execute the **maddsvc** ("add service") command, which takes the **service name** and the **GraphQL model** definition (i.e., your types, queries, mutations, and subscriptions):

```bash
gql maddsvc -p ckg -n Basic -s basic/model.gql
Using endpoint default: {"url":"http://qtraining01.knowledge.maana.io:8003/graphql"}
Read file: basic/model.gql size: 136
Sending query:
  mutation addServiceSource($input: AddServiceSourceInput!) {
    addServiceSource(input: $input)
  }
  ...
✔ Call succeeded:
{"addServiceSource":"1788c00e-3a29-4843-aa56-44ba374cf682"}
```

Take note of the generated service id, since we&#39;l add it as a new GraphQL **endpoint** to your CLI configuration.

```bash
gql add-project
? Enter project name for new project: basic
? Local schema file path: basic/schema.graphql
? Endpoint URL (Enter to skip): http://qtraining01.knowledge.maana.io:8003/service/1788c00e-3a29-4843-aa56-44ba374cf682/graphql
? Name of this endpoint, for e.g. default, dev, prod: (default)
? Subscription URL (Enter to skip):
? Do you want to add other endpoints? No

Adding the following endpoints to your config:  basic
? Is this ok? Yes
```

And retrieve the schema from the **service** , which will populate the schemaPath (i.e., basic/schema.graphql) with the generated schema for your service:

```bash
gql get-schema -p basic
```

## Creating Instance Data

Create instances from common data formats, such as CSV and JSON that conform to the model. The /basic examples of person and employer instance data are given below.

### person.csv

```baash
"id","name","dob","employer"
"P00","Han Solo","1942-07-13","E00"
"P01","George Lucas","1944-05-14","E00"
```

### employer.csv

```baash
"id","name","ceo"
"E00","Lucasfilm Ltd.","P01"
```

### person.json

```json
[
  {
    "id": "P00",
    "name": "Han Solo",
    "dob": "1942-07-13",
    "employer": "E00"
  },
  {
    "id": "P01",
    "name": "George Lucas",
    "dob": "1944-05-14",
    "employer": "E00"
  }
]
```

### employer.json

```json
[
  {
    "id": "E00",
    "name": "Lucasfilm Ltd.",
    "ceo": "P01"
  }
]
```

## Loading Instance Data

The above CSV and JSON data can be loaded by using the &#39;load&#39; GraphQL CLI command, passing the mutation to call, the data file, field mappings (if any). delimeters, etc.

```bash
gql mload -p basic -m addPersons -j basic/person.json
gql mload -p basic -m addEmployers -j basic/employer.json
```

## Using Default Queries

The boilerplate for persisted models includes add/update/delete mutations as well as get by id and get batch by ids queries that can be used from GraphiQL, the CLI, or from any GraphQL client. For the above &#39;basic&#39; example, we define the below queries.

This is exactly the same format as you would use in GraphiQL ---- try cut-and-pasting the below into a GraphiQL session against your service.

### basicOps.gql

```graphql
fragment personDetail on Person {
  name
  dob
  employer {
    ...employerDetail
  }
}

fragment employerDetail on Employer {
  name
  ceo {
    name
  }
}

query person($id: ID!) {
  person(id: $id) {
    ...personDetail
  }
}

query allPersons {
  allPersons {
    ...personDetail
  }
}

query employer($id: ID!) {
  employer(id: $id) {
    ...employerDetail
  }
}

query allEmployers {
  allEmployers {
    ...employerDetail
  }
}
```

These queries can be invoked from the command line, such as:

```bash
gql query basic/basicOps.gql -p basic -o allEmployers
gql query basic/basicOps.gql -p basic -o person --variables "{\"id\":\"P01\"}"
```

## Issuing a Kind Query

TODO
