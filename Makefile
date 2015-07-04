.PHONY: all chrome firefox devel

VERSION=$(shell git describe --dirty)
ARCHIVE_NAME=lovely-forks-${VERSION}.zip

all: firefox chrome

chrome:
	@echo "Exporting ${ARCHIVE_NAME}"
	@git archive HEAD -o ${ARCHIVE_NAME}

firefox: chrome
	@rm -rf .tmp
	@mkdir -p .tmp
	@unzip -q ${ARCHIVE_NAME} -d .tmp
	@cfx xpi --pkgdir=.tmp/app --force-mobile

devel:
	@echo "Doing a development build."
	@zip ${ARCHIVE_NAME} $(shell git ls-tree HEAD --full-name --name-only -r)
	@rm -rf .tmp
	@mkdir -p .tmp
	@unzip -q ${ARCHIVE_NAME} -d .tmp
	@cfx xpi --pkgdir=.tmp/app --force-mobile



