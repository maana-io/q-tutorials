FROM microsoft/dotnet:latest
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY . /app

WORKDIR /app

# Peer/remote GraphQL services used
ENV REMOTE_KSVC_ENDPOINT_URL=https://cstraining01.knowledge.maana.io:8443/service/c3e896d4-dce5-4682-b3f8-57b9b0d9e459/graphql

# Auth
ENV MACHINE_TO_MACHINE_APP_AUTH_DOMAIN=maana-sales.auth0.com
ENV MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID=IbAE6zxzXtzw577FXkL19WvAewcxAIur
ENV MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET=soYHc03OFIWWG798l1YdqUohcwn-tM9iAsW6AlpG6hGdiA763AzUDdEQelVHMYVM
ENV MACHINE_TO_MACHINE_APP_AUTH_IDENTIFIER=https://h4.maana.io/

RUN ["dotnet", "restore"]
RUN ["dotnet", "build"]

EXPOSE 5000/tcp

# Build runtime image
ENTRYPOINT [ "dotnet", "watch", "run", "--no-restore", "--urls", "http://0.0.0.0:5000"]
