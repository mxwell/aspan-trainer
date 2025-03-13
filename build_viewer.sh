#! /bin/bash

set -xe

OUTPUT_DIR=dist
EN_OUTPUT="${OUTPUT_DIR}/en"
KK_OUTPUT="${OUTPUT_DIR}/kk"
EN_POSTS="${EN_OUTPUT}/posts"

rm -rf $OUTPUT_DIR/*

# export NODE_ENV="development"
parcel build static/src/html/about_{en,kk,ru}.pug
parcel build static/src/html/dict_{en,ru}.pug
parcel build static/src/html/present_top_{en,ru}.pug
parcel build static/src/html/text_analyzer_{en,ru}.pug
parcel build static/src/html/verb_gym_{en,ru}.pug
parcel build static/src/html/declension_{en,ru}.pug
parcel build static/src/html/explanation_{en,ru}.pug
parcel build static/src/html/viewer{,_en,_kk}.pug
parcel build static/src/html/gc_create_{en,ru}.pug
parcel build static/src/html/gc_description_{en,ru}.pug
parcel build static/src/html/gc_feed_{en,ru}.pug
parcel build static/src/html/gc_landing_{en,ru}.pug
parcel build static/src/html/gc_reviews_{en,ru}.pug
parcel build static/src/html/gc_search_{en,ru}.pug
parcel build static/src/html/gc_stats_{en,ru}.pug
parcel build static/src/html/login_{en,ru}.pug

parcel build static/src/html/posts_en.pug
parcel build static/src/html/post_llm_vocab_en.pug
parcel build static/src/html/post_dict_bench_en.pug

cp static/src/images/{copy,copy_pressed,expand_down,expand_up,toggle_off,toggle_on}.svg $OUTPUT_DIR/
cp static/src/images/{one_to_one,one_to_many,many_to_one,many_to_many}.png $OUTPUT_DIR/
cp static/src/images/check_{box,box_blank,box_indet}.svg $OUTPUT_DIR/
cp static/src/images/{edit_square,keyboard,share,sound}.svg $OUTPUT_DIR/
cp static/src/images/{create,delete,edit,restart,thumb_down,thumb_up,warning}.svg $OUTPUT_DIR/
cp static/src/images/{info,book}.svg $OUTPUT_DIR/

cp static/src/data/present_top100_ru_en.colonsv $OUTPUT_DIR/

mv "${OUTPUT_DIR}/viewer.html" "${OUTPUT_DIR}/index.html"
mkdir -p ${EN_OUTPUT}
mv "${OUTPUT_DIR}/viewer_en.html" "${EN_OUTPUT}/index.html"
mkdir -p ${KK_OUTPUT}
mv "${OUTPUT_DIR}/viewer_kk.html" "${KK_OUTPUT}/index.html"

mkdir -p ${EN_POSTS}
mv "${OUTPUT_DIR}/posts_en.html" "${EN_POSTS}/index.html"
mv "${OUTPUT_DIR}/post_llm_vocab_en.html" "${EN_POSTS}/llm_vocab.html"
mv "${OUTPUT_DIR}/post_dict_bench_en.html" "${EN_POSTS}/dict_bench.html"

cp static/src/robots.txt $OUTPUT_DIR/

echo "Output files are put under ${OUTPUT_DIR}"
