#!/bin/sh -e

# This script will invoke your lambda with a fake SNS message(chime or dontchime)
#
# Invoke slapBot with a 9:45 a.m. chime:
# ./invoke.sh chime.json
#
# Invoke slapBot with a time that won't chime:
# ./invoke.sh dontchime.json

aws lambda invoke \
    --function-name slapBot \
    --payload file://$(pwd)/scripts/$1 \
    output.txt

echo "Lambda output:"
cat output.txt
echo ""
