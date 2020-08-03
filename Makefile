.PHONY: build ci deps doc fmt fmt-check lint lock precommit test typedoc

build:
	@deno run --lock=lock.json --reload mod.ts

ci:
	@make fmt-check
	@make build
	@make test

deps:
	@npm install -g typescript typedoc

doc:
	@deno doc ./mod.ts

fmt:
	@deno fmt

fmt-check:
	@deno fmt --check

lint:
	@deno lint --unstable

lock:
	@deno run --lock=lock.json --lock-write --reload mod.ts

precommit:
	@make typedoc
	@make fmt
	@make fmt
	@make lock

test:
	@deno test --allow-net --allow-read --allow-env

typedoc:
	@rm -rf docs
	@typedoc --ignoreCompilerErrors --out ./docs --mode modules --includeDeclarations --excludeExternals --name superdeno ./src
	@make fmt
	@make fmt
	@echo 'future: true\nencoding: "UTF-8"\ninclude:\n  - "_*_.html"\n  - "_*_.*.html"' > ./docs/_config.yaml

