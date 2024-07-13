WEB_BUILD_IMAGE_TAG="hive:web_build"

.PHONY: build_image builder deploy_local

build_image: Dockerfile
	docker build --tag ${WEB_BUILD_IMAGE_TAG} --file $< .

builder:
	docker run -it --rm -v "${PWD}:/frontend" ${WEB_BUILD_IMAGE_TAG} bash

sitemap.xml: ../data/verbs_fe_soft.csv
	scripts/generate_sitemap.py --host "https://kazakhverb.khairulin.com" --verbs-path $< --lastmod "2024-07-14"

deploy_local: dist
	sudo rm -rf /var/www/kazakhverb && sudo cp -r dist /var/www/kazakhverb
