WEB_BUILD_IMAGE_TAG="hive:web_build"

.PHONY: build_image builder

build_image: Dockerfile
	docker build --tag ${WEB_BUILD_IMAGE_TAG} --file $< .

builder:
	docker run -it --rm -v "${PWD}:/frontend" ${WEB_BUILD_IMAGE_TAG} bash
