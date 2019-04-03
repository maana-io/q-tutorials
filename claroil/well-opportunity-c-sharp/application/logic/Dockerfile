FROM microsoft/dotnet:latest
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY . /app

WORKDIR /app

RUN ["dotnet", "restore"]
RUN ["dotnet", "build"]

EXPOSE 5000/tcp

# Build runtime image
ENTRYPOINT [ "dotnet", "watch", "run", "--no-restore", "--urls", "http://0.0.0.0:5000"]
