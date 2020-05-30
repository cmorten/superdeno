.PHONY: build ci doc fmt fmt-check lock precommit test typedoc

build:
	@deno run --lock=lock.json --reload mod.ts

ci:
	@make fmt-check
	@make build
	@make test

doc:
	@deno doc ./mod.ts

fmt:
	@deno fmt

fmt-check:
	@deno fmt --check

lock:
	@deno run --lock=lock.json --lock-write --reload mod.ts

precommit:
	@make typedoc
	@make fmt
	@make fmt
	@make lock

test:
	@deno test --allow-net --allow-read

typedoc:
	@typedoc --ignoreCompilerErrors --out ./docs --mode modules --includeDeclarations --excludeExternals ./src

