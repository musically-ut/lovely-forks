.PHONY: all chrome firefox

VERSION=$(shell git describe)
ARCHIVE_NAME=lovely-forks-${VERSION}.zip

all: firefox chrome

chrome:
	@echo "Exporting ${ARCHIVE_NAME}"
	@git archive master -o ${ARCHIVE_NAME}

firefox: chrome
	@rm -rf .tmp
	@mkdir -p .tmp
	@unzip -q ${ARCHIVE_NAME} -d .tmp
	@cfx xpi --pkgdir=.tmp/app


