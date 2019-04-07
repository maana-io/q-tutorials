FROM microsoft/dotnet:latest
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY . /app

WORKDIR /app

# Peer/remote GraphQL services used
ENV REMOTE_KSVC_ENDPOINT_URL=

# Auth
ENV MACHINE_TO_MACHINE_APP_AUTH_DOMAIN=
ENV MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID=
ENV MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET=
ENV MACHINE_TO_MACHINE_APP_AUTH_IDENTIFIER=


RUN ["dotnet", "restore"]
RUN ["dotnet", "build"]

EXPOSE 5000/tcp

# Build runtime image
ENTRYPOINT [ "dotnet", "watch", "run", "--no-restore", "--urls", "http://0.0.0.0:5000"]
