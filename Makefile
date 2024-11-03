WEB_BUILD_IMAGE_TAG="hive:web_build"

.PHONY: build_image builder deploy_local

build_image: Dockerfile
	docker build --tag ${WEB_BUILD_IMAGE_TAG} --file $< .

builder:
	docker run -it --rm -v "${PWD}:/frontend" ${WEB_BUILD_IMAGE_TAG} bash

gen_sitemap/sitemap_index.xml: ../data/verbs_fe_soft.csv
	scripts/generate_sitemap.py --host "https://kazakhverb.khairulin.com" --verbs-path $< --lastmod "2024-11-03" --dict-forms ../kiltman/build/combined.20241102.jsonl

deploy_local: dist
	sudo rm -rf /var/www/kazakhverb && sudo cp -r dist /var/www/kazakhverb
