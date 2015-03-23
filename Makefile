tsc=tsc --module commonjs --outDir lib src/*.ts
mocha=mocha -r lib/test.js lib/*Test.js
.PHONY: js
js:
	$(tsc)

.PHONY: jsw
jsw:
	$(tsc) -w

.PHONY: test
test: js
	$(mocha)

.PHONY: testw
testw:
	$(mocha) -w --reporter min

.PHONY: wc
wc:
	find src -name \*.ts | xargs wc