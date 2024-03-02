#! /bin/bash

set -xe

OUTPUT_DIR=dist
EN_OUTPUT="${OUTPUT_DIR}/en"
KK_OUTPUT="${OUTPUT_DIR}/kk"

rm -rf $OUTPUT_DIR/*

# export NODE_ENV="development"
parcel build static/src/html/about_{en,kk,ru}.pug
parcel build static/src/html/explanation_{en,ru}.pug
parcel build static/src/html/viewer{,_en,_kk}.pug

cp static/src/images/{bg1.png,expand_down.svg,expand_up.svg} $OUTPUT_DIR/

mv "${OUTPUT_DIR}/viewer.html" "${OUTPUT_DIR}/index.html"
mkdir -p ${EN_OUTPUT}
mv "${OUTPUT_DIR}/viewer_en.html" "${EN_OUTPUT}/index.html"
mkdir -p ${KK_OUTPUT}
mv "${OUTPUT_DIR}/viewer_kk.html" "${KK_OUTPUT}/index.html"

echo "Output files are put under ${OUTPUT_DIR}"
