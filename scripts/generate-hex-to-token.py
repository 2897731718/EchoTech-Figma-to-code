#!/usr/bin/env python3
"""
从官方 token JSON 文件生成 hex-to-token.json 映射
用法: python3 generate-hex-to-token.py <token文件路径> [输出路径]
"""

import json
import sys
import os
from typing import Dict, Any, List, Tuple

def rgba_to_string(hex_color: str, alpha: float) -> str:
    """将 hex + alpha 转换为 rgba 字符串"""
    if alpha >= 0.99:
        return hex_color.upper()

    # 解析 hex
    hex_clean = hex_color.lstrip('#')
    r = int(hex_clean[0:2], 16)
    g = int(hex_clean[2:4], 16)
    b = int(hex_clean[4:6], 16)

    # 格式化 alpha，去掉不必要的小数位
    if alpha == int(alpha):
        alpha_str = str(int(alpha))
    else:
        # 保留2位小数，去掉尾部0
        alpha_str = f"{alpha:.2f}".rstrip('0').rstrip('.')

    return f"rgba({r},{g},{b},{alpha_str})"

def path_to_css_var(path: List[str]) -> str:
    """将 token 路径转换为 CSS 变量名"""
    # text.1 → --text-1
    # primary.bt.solidBg → --primary-bt-solid-bg
    parts = []
    for p in path:
        # 驼峰转连字符
        result = ''
        for i, c in enumerate(p):
            if c.isupper() and i > 0:
                result += '-' + c.lower()
            else:
                result += c.lower()
        parts.append(result)

    return '--' + '-'.join(parts)

def extract_tokens(obj: Dict[str, Any], path: List[str] = None) -> List[Tuple[str, str, str]]:
    """
    递归提取所有 token
    返回: [(color_string, css_var_name, original_path), ...]
    """
    if path is None:
        path = []

    results = []

    for key, value in obj.items():
        if key.startswith('$'):
            continue

        current_path = path + [key]

        if isinstance(value, dict):
            if '$type' in value and value.get('$type') == 'color':
                # 这是一个 token
                val = value.get('$value', {})

                # 跳过别名引用（$value 是字符串如 "{primary.5}"）
                if isinstance(val, str):
                    continue

                hex_color = val.get('hex', '')
                alpha = val.get('alpha', 1)

                if hex_color:
                    color_str = rgba_to_string(hex_color, alpha)
                    css_var = path_to_css_var(current_path)
                    original = '/'.join(current_path)
                    results.append((color_str, css_var, original))
            else:
                # 继续递归
                results.extend(extract_tokens(value, current_path))

    return results

def get_token_priority(css_var: str) -> int:
    """
    获取 token 优先级，数字越小优先级越高
    优先使用通用语义 token，而不是特定场景 token
    """
    priorities = {
        'text': 1,
        'icon': 2,
        'bg': 3,
        'border': 4,
        'mask': 5,
        'primary': 10,
        'secondary': 11,
        'error': 12,
        'success': 13,
        'warning': 14,
        'trade': 15,
        'white': 16,
        'default': 17,
        'trans': 18,
    }

    # 解析分类名
    parts = css_var.lstrip('-').split('-')
    if len(parts) >= 1:
        category = parts[0]
        return priorities.get(category, 50)
    return 50

def generate_mapping(token_file: str) -> Dict[str, str]:
    """从 token 文件生成 hex → css var 映射"""
    with open(token_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    tokens = extract_tokens(data)

    # 收集每个颜色的所有候选 token
    from collections import defaultdict
    color_candidates: Dict[str, List[Tuple[str, int]]] = defaultdict(list)

    for color_str, css_var, original in tokens:
        priority = get_token_priority(css_var)
        color_candidates[color_str].append((css_var, priority))

        # 对于 hex 颜色，同时添加小写版本
        if color_str.startswith('#'):
            lower = color_str.lower()
            color_candidates[lower].append((css_var, priority))

    # 为每个颜色选择优先级最高（数字最小）的 token
    mapping = {}
    for color_str, candidates in color_candidates.items():
        best = min(candidates, key=lambda x: x[1])
        mapping[color_str] = best[0]

    return mapping

def main():
    if len(sys.argv) < 2:
        print("用法: python3 generate-hex-to-token.py <token文件路径> [输出路径]")
        print("示例: python3 generate-hex-to-token.py 'Product A.tokens.json' ../tokens/hex-to-token.json")
        sys.exit(1)

    token_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'hex-to-token.json'

    if not os.path.exists(token_file):
        print(f"错误: 文件不存在 - {token_file}")
        sys.exit(1)

    print(f"读取 token 文件: {token_file}")
    mapping = generate_mapping(token_file)

    # 按 key 排序
    sorted_mapping = dict(sorted(mapping.items()))

    print(f"生成 {len(sorted_mapping)} 个映射")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sorted_mapping, f, indent=2, ensure_ascii=False)

    print(f"已保存到: {output_file}")

    # 打印统计
    categories = {}
    for css_var in mapping.values():
        cat = css_var.split('-')[2] if len(css_var.split('-')) > 2 else 'other'
        categories[cat] = categories.get(cat, 0) + 1

    print("\n各分类数量:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

if __name__ == '__main__':
    main()
