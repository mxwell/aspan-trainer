WEB_BUILD_IMAGE_TAG="hive:web_build"
SCRAPPED_DIR="ssr/input"
SSR_OUTPUT="ssr/output"

.PHONY: build_image builder clean_ssr

build_image: Dockerfile
	docker build --tag ${WEB_BUILD_IMAGE_TAG} --file $< .

builder:
	docker run -it --rm -v "${PWD}:/frontend" ${WEB_BUILD_IMAGE_TAG} bash

${SSR_OUTPUT}:
	mkdir -p ${SSR_OUTPUT}
	scripts/modify_scrapped.py --input-directory ${SCRAPPED_DIR} --root https://kazakhverb.khairulin.com --output-directory ${SSR_OUTPUT}

sitemap.xml: ${SSR_OUTPUT}
	scripts/generate_sitemap.py --input-directory ${SSR_OUTPUT} --url-prefix https://kazakhverb.khairulin.com/ssr/

clean_ssr:
	rm -rf ${SSR_OUTPUT} sitemap.xml

deploy_local: dist
	sudo rm -rf /var/www/kazakhverb && sudo cp -r dist /var/www/kazakhverb
