build: 
	go build -o bin/main cmd/api/main.go

run:
	go run cmd/api/main.go

tune:
	go run tuning/parameter_tuning.go

migrate_flatfiles:
	go run cmd/migrate/main.go

format: 
	go fmt ./...
	npx prettier --write . --ignore-path .prettierignore 

tailwind 
  npx tailwindcss -i ./styles.css -o ./output.css --watch
