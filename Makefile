build: 
	go build -o bin/main cmd/api/main.go

run:
	go run cmd/api/main.go

tune:
	go run tuning/parameter_tuning.go

format: 
	go fmt ./...
	npx prettier --write . --ignore-path .prettierignore 