tsc=tsc --module commonjs --outDir lib src/*.ts
mocha=mocha -r lib/test.js lib/*Test.js
gendts=dts-generator --baseDir src/ --name xmd --main xmd/Xmd --out xmd.d.ts src/Xmd.ts

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

.PHONY: release
release: js xmd.d.ts
	echo run: npm publish

.PHONY: xmd.d.ts
xmd.d.ts:
	@echo Generate module definition file: xmd.d.ts
	$(gendts)