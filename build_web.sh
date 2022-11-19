#! /bin/bash

set -xe

export OUTPUT_DIR=dist

rm -rf $OUTPUT_DIR/*

parcel build static/src/javascripts/boot.jsx
parcel build static/src/javascripts/viewer.jsx

for path in static/src/html/*.pug
do
	parcel build $path
done

cp static/src/images/favicon.png $OUTPUT_DIR/favicon.png

echo "Output files are put under ${OUTPUT_DIR}"
