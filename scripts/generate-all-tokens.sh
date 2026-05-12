#!/bin/bash
# 批量生成所有产品的 hex-to-token 映射

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOKEN_SOURCE="/Users/popo/Documents/feiShuDown/01 tokens"
OUTPUT_DIR="$SCRIPT_DIR/../tokens"

echo "=== 批量生成 hex-to-token 映射 ==="

# Product A
echo -e "\n--- Product A ---"
python3 "$SCRIPT_DIR/generate-hex-to-token.py" \
  "$TOKEN_SOURCE/00 product-a/Product A.tokens.json" \
  "$OUTPUT_DIR/product-a.json"

# Product B
echo -e "\n--- Product B ---"
python3 "$SCRIPT_DIR/generate-hex-to-token.py" \
  "$TOKEN_SOURCE/01 product-b/Product B.tokens.json" \
  "$OUTPUT_DIR/product-b.json"

# Product C
echo -e "\n--- Product C ---"
python3 "$SCRIPT_DIR/generate-hex-to-token.py" \
  "$TOKEN_SOURCE/02 product-c/Product C.tokens.json" \
  "$OUTPUT_DIR/product-c.json"

# Product D
echo -e "\n--- Product D ---"
python3 "$SCRIPT_DIR/generate-hex-to-token.py" \
  "$TOKEN_SOURCE/03 product-d/Product D.tokens.json" \
  "$OUTPUT_DIR/product-d.json"

echo -e "\n=== 完成 ==="
ls -la "$OUTPUT_DIR"/*.json
