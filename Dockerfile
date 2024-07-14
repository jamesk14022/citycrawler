ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
COPY web/ web/

RUN go build -v -o /run-app cmd/api/main.go

FROM debian:bookworm


COPY --from=builder /run-app /usr/local/bin/
COPY --from=builder /usr/src/app/web /usr/local/web
COPY --from=builder /usr/src/app/cache_data.json /usr/local/cache_data.json
CMD ["run-app"]
