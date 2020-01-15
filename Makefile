.PHONY: all chrome firefox devel readybuild

VERSION=$(shell git describe --dirty)
ARCHIVE_NAME=lovely-forks-${VERSION}
TMP_FOLDER=tmp


readybuild:
	@echo "Preparing ${TMP_FOLDER} for building ..."
	@rm -rf ${TMP_FOLDER}
	@mkdir -p ${TMP_FOLDER}
	@mkdir -p build/
	@rsync -av webext ${TMP_FOLDER} --exclude="*.orig" --exclude="*~" --exclude="*.sw?"
	@cp LICENSE README.md ${TMP_FOLDER}


chrome: readybuild
	@echo "Exporting build/${ARCHIVE_NAME}.chrome.zip"
	@cat manifest.template.json | jq 'del(.applications)' > ${TMP_FOLDER}/manifest.json
	@cd ${TMP_FOLDER}; zip -r ../build/${ARCHIVE_NAME}.chrome.zip .


firefox: readybuild
	@echo "Exporting Firefox build"
	@cp manifest.template.json ${TMP_FOLDER}/manifest.json
	@web-ext lint --source-dir=${TMP_FOLDER}/ --ignore-files "webext/options_ui/js/semantic.js" "webext/options_ui/js/jquery-*.js"
	@web-ext build --source-dir=${TMP_FOLDER}/ --overwrite-dest --artifacts-dir=build/


manifest:
	@cat manifest.template.json | jq 'del(.applications)' > manifest.json


all: firefox chrome
