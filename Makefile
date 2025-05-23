.PHONY: build ci deps doc fmt fmt-check lint precommit test typedoc

FILES_TO_FORMAT = ./src ./test ./deps.ts ./mod.ts ./version.ts

build:
	@deno run --allow-import --allow-env --allow-sys --allow-read --reload mod.ts

ci:
	@make fmt-check
	@make lint
	@make build
	@make test

deps:
	@npm install -g typescript@4 typedoc@0.19.2

doc:
	@deno doc --allow-import ./mod.ts

fmt:
	@deno fmt ${FILES_TO_FORMAT}

fmt-check:
	@deno fmt --check ${FILES_TO_FORMAT}

lint:
	@deno lint ${FILES_TO_FORMAT}

precommit:
	@make typedoc
	@make fmt
	@make fmt

test:
	@deno test --allow-import --allow-net --allow-read --allow-env --allow-sys --no-check

typedoc:
	@rm -rf docs
	@typedoc --ignoreCompilerErrors --out ./docs --mode modules --includeDeclarations --excludeExternals --name superdeno ./src
	@make fmt
	@make fmt
	@echo 'future: true\nencoding: "UTF-8"\ninclude:\n  - "_*_.html"\n  - "_*_.*.html"' > ./docs/_config.yaml

