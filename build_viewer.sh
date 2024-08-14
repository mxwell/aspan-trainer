#! /bin/bash

set -xe

OUTPUT_DIR=dist
EN_OUTPUT="${OUTPUT_DIR}/en"
KK_OUTPUT="${OUTPUT_DIR}/kk"

rm -rf $OUTPUT_DIR/*

# export NODE_ENV="development"
parcel build static/src/html/about_{en,kk,ru}.pug
parcel build static/src/html/present_top_{en,ru}.pug
parcel build static/src/html/verb_detector_{en,ru}.pug
parcel build static/src/html/verb_gym_{en,ru}.pug
parcel build static/src/html/declension_{en,ru}.pug
parcel build static/src/html/explanation_{en,ru}.pug
parcel build static/src/html/viewer{,_en,_kk}.pug
parcel build static/src/html/gc_create_ru.pug
parcel build static/src/html/gc_feed_ru.pug
parcel build static/src/html/gc_reviews_ru.pug
parcel build static/src/html/gc_search_ru.pug
parcel build static/src/html/gc_stats_ru.pug

cp static/src/images/{copy,copy_pressed,expand_down,expand_up,toggle_off,toggle_on}.svg $OUTPUT_DIR/
cp static/src/images/{one_to_one,one_to_many,many_to_one,many_to_many}.png $OUTPUT_DIR/
cp static/src/images/check_{box,box_blank,box_indet}.svg $OUTPUT_DIR/
cp static/src/images/sound.svg $OUTPUT_DIR/
cp static/src/images/{edit,restart,thumb_down,thumb_up}.svg $OUTPUT_DIR/

mv "${OUTPUT_DIR}/viewer.html" "${OUTPUT_DIR}/index.html"
mkdir -p ${EN_OUTPUT}
mv "${OUTPUT_DIR}/viewer_en.html" "${EN_OUTPUT}/index.html"
mkdir -p ${KK_OUTPUT}
mv "${OUTPUT_DIR}/viewer_kk.html" "${KK_OUTPUT}/index.html"

echo "Output files are put under ${OUTPUT_DIR}"
