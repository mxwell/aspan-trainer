#! /bin/bash

set -xe

export OUTPUT_DIR=dist

rm -rf $OUTPUT_DIR/*

# export NODE_ENV="production"
parcel build static/src/html/viewer.pug
cp static/src/images/favicon.png $OUTPUT_DIR/favicon.png

echo "Output files are put under ${OUTPUT_DIR}"
