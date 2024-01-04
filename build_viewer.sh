#! /bin/bash

set -xe

export OUTPUT_DIR=dist

rm -rf $OUTPUT_DIR/*

# export NODE_ENV="development"
parcel build static/src/html/viewer.pug
cp static/src/images/* $OUTPUT_DIR/

echo "Output files are put under ${OUTPUT_DIR}"