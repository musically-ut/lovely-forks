.PHONY: all chrome firefox devel readybuild

VERSION=$(shell git describe --dirty)
ARCHIVE_NAME=lovely-forks-${VERSION}
PWD=$(shell pwd)
ADDON_DIR="${PWD}/.tmp/app"

all: firefox chrome

readybuild:
	@echo "Preparing .tmp for building ..."
	@rm -rf .tmp/
	@mkdir -p .tmp/
	@mkdir -p build/
	@cp -r webext .tmp/
	@cp LICENSE README.md .tmp/


chrome: readybuild
	@echo "Exporting build/${ARCHIVE_NAME}.chrome.zip"
	@cat manifest.template.json | jq 'del(.applications)' > .tmp/manifest.json
	@cd .tmp; zip ../build/${ARCHIVE_NAME}.chrome.zip **/*


firefox: readybuild
	@echo "Exporting Firefix build"
	@cp manifest.template.json .tmp/manifest.json
	@web-ext lint --source-dir=.tmp/ && web-ext build --source-dir=.tmp/ --overwrite-dest --artifacts-dir=build/
