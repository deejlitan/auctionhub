FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["AuctionApi.csproj", "."]
COPY NuGet.Config .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

RUN mkdir -p /app/Data

ENV ASPNETCORE_URLS=http://+:8080
ENV DataDirectory=/app/Data

EXPOSE 8080
ENTRYPOINT ["dotnet", "AuctionApi.dll"]
