# MAANA.IO - .NET Core (C#) - GraphQL Service Template (Basic)

## What's the purpose of this template?
To provide an example of how a GraphQL service is built using a particular technology stack, in this case .NET Core in C#.
It is assumed you are familiar with developing .NET applications in C#.

## What are this template's capabilities?
Basic GraphQL interactions over HTTP. This template creates an application exposing a GraphQL endpoint with a Star Wars theme. With this endpoint you can examine the service's graphql schema, which will tell you about its types, queries, mutations, and subsriptions (look at the additional resources section at the bottom of this page if you don't know what these terms mean). Through the endpoint, and in the visual GraphQL playground, you can execute operations on the example database that is hardcoded in the application. Getting from the project files to an up-and-running application can be accomplished in one command through docker or the .NET Core CLI.

## What are the key technologies?
-.NET Core and ASP.NET Core
-GraphQl
-Docker

## About the template's dummy database and repository
This template uses a dummy database with a strongly typed repository to help you understand how your datasource (frequenly entity framework (EF) for .NET) can be leveraged via a graphql endpoint with an appropriate level of decoupling.

## Required Software
- Docker: (developed/tested with version 18.09.3). 

- .NET Core: (developed/tested with version 2.2). **If only starting/running this template with Docker, independent .NET Core download is not necessary as Docker will pull in the .NET Core Runtime. However, for local development and debugging, .NET Core SDK and Runtime are needed.

-IDE: Visual Studio Code recommended (built/tested with version 1.32.3), with C# Extension (version 1.18.0 or newer from Microsoft). Visual Studio 2017 (version 15.3 or newer) is also an option and, additionally, has built in support for Docker. 

***Microsoft resources for .NET Core:
https://docs.microsoft.com/en-us/dotnet/core/windows-prerequisites?tabs=netcore2x

https://dotnet.microsoft.com/download

https://docs.microsoft.com/en-us/dotnet/core/tutorials/index

https://docs.microsoft.com/en-us/dotnet/core/index


***Docker resources for Windows:
https://docs.docker.com/docker-for-windows/


***Docker resources for .NET Core:
https://hub.docker.com/_/microsoft-dotnet-core


## Building and running this template
Use either the below Docker or .NET build instructions, then open the GraphQL playgroun exposed by the application in "http://localhost:5000". 

-IN .NET (CLI):
The root-level project directory run the following .NET Core command:

```bash
dotnet build
dotnet run
```

-IN DOCKER (CLI) (Docker required):
The root-level project directory contains a Dockerfile.
The following docker command sequentially builds and then runs in docker.

```bash
docker build -t q_dotnet . && docker run -p 5000:5000 q_dotnet
```


#Post build/run health check of the service
-After building and running in docker, you should see the following CLI output from the application:

```bash
watch : Polling file watcher is enabled
watch : Started
[21:42:06 INF] Starting application
Hosting environment: Development
Content root path: /app
Now listening on: http://0.0.0.0:5000
Application started. Press Ctrl+C to shut down.
[21:42:12 INF] CORS policy execution successful.
[21:42:15 INF] CORS policy execution successful.
[21:42:18 INF] CORS policy execution successful.
(CORS MESSAGES WILL CONTINUE PER REQUEST)
```

-Any errors should be visible in this output with stack trace.

## Example queries in the GraphQL playground
-GraphQL operations can be executed in the graphql playgound on the localhost endpoint in the left-hand side panel.
--Info Query:

```graphql
query {
  info {
    id
    name
    description
  }
}
```

--Info Query Response: (The query response will be the "data" property, meta-data associated with the response will be in the "extensions")

```json
{
"data": {
"info": {
"id": "ed7584-2124-98fs-00s3-t739478t",
"name": "maana.io.template",
"description": "Dockerized ASP.NET Core GraphQL Template"
}
},
"extensions": {
"tracing": {
"version": 1,
"startTime": "2019-02-25T21:45:53.8003062Z",
"endTime": "2019-02-25T21:45:53.8033062Z",
"duration": 2695400,
"parsing": {
...
...
```

--createHuman mutation (adds a human):

```graphql
mutation {
  createHuman(
    human: {
      name: "You"
      dateOfBirth: "02/28/1970"
      homePlanet: "Dantooine"
      appearsIn: [NEWHOPE]
    }
  ) {
    id
  }
}
```

--createHuman mutation response:

```json
{
"data": {
"createHuman": {
"id": "b1dd619e-be0d-40b5-8706-b2e14b3032c4"
}
},
"extensions": {
"tracing": {
"version": 1,
"startTime": "2019-02-26T04:29:21.942681Z",
"endTime": "2019-02-26T04:29:21.943681Z",
...
...
```

## GraphQL Relay
GraphQL 'Relay' for paging and connection-based queries is not used in this template, however, it IS supported by dotnet-graphql (the library underlying this template) and can be incorporated fairly easily.

Relay must be enabled in the CustomServiceCollectionExtensions.cs file--it is currently commented out. 

## Query Depth and Complexity
dotnet-graphql allows for validation to include GraphQL query depth and complexity. Critically, this can prevent denial of service (DOS) where a query's computational or spacial complexity can exceeed a server's resources. 

This can be adjusted as needed in the appsettings.json file. Defaults are depth=50 and complexity=1000 (calculated by each field requested being equal to 1 point of complexity).

## Authorization -- Claim-based access
Authorization is disabled in this template. 
The "admin" policy can be uncommented in CustomServiceCollectionExtensions.cs.
Examples of how to add authorization to entire classes or particular fields
can be seen in Types/HumanObject.cs (currently commented out).

## Application URL/Port
By default, the application listens on "http://localhost:5000". 
This can be adjusted in Properties/launchSettings.json. 
For development, adjust the "applicationUrl" property of the Kestrel config
object (as shown below):
```bash
    "Kestrel": {
      "commandName": "Project",
      "launchBrowser": true,
      "launchUrl": "",
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
```

## Additional Resources

GraphQL.org for general graphql concepts and info
https://graphql.org/

The GraphQL .NET library on GitHub
https://github.com/graphql-dotnet/graphql-dotnet

Dockerizing .NET Core applications
https://docs.microsoft.com/en-us/dotnet/core/docker/docker-basics-dotnet-core

Common docker error for .NET port binding
https://stackoverflow.com/questions/51188774/docker-dotnet-watch-run-error-unable-to-bind-to-https-localhost5000-on-the-i

Dotnet-Boxed Templates - Github
https://github.com/Dotnet-Boxed/Templates

Example use of Dotnet-Boxed Templates (scaffolding for this template)
https://elanderson.net/2018/07/asp-net-core-with-graphql-using-net-boxed/
