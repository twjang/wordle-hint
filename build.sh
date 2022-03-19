#!/bin/sh
ROOT=$(realpath $(dirname $0))

rm -rf $ROOT/dist
mkdir $ROOT/dist

# frontend
cd $ROOT/frontend
npm run build --release

cp $ROOT/frontend/build $ROOT/dist/static/ -R

# backend
cd $ROOT/backend
cargo build --release
cp $ROOT/backend/target/release/wordle-solve-backend $ROOT/dist/
cp $ROOT/backend/dict $ROOT/dist/ -R
