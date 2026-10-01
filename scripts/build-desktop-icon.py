"""Build the ORCA MAID desktop shortcut ICO from its 512 px page icon.

Windows 端「桌面快捷方式跟随皮肤」会用 skin.json#desktopIcon 指向的这个 ICO。
ICO 字节不计入构建指纹（指纹只覆盖 skin.json 里的路径），所以换图标后
重新跑本脚本即可，不需要动 skin.build.json。

内联自上游 scripts/build-orca-desktop-icon.py，只把皮肤目录与输出名改为本包。

用法: python3 scripts/build-desktop-icon.py
"""
import re
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
source = (root / 'src' / 'client' / 'page-icon-art.generated.ts').read_text(encoding='utf-8')
match = re.search(r"PAGE_ICON_512 = skinAssetUrl\('([a-f0-9]{64}\.png)'\)", source)
if match is None:
    raise SystemExit('PAGE_ICON_512 reference not found')

name = match.group(1)
target = root / 'assets' / 'icons' / 'orca-maid.ico'
target.parent.mkdir(parents=True, exist_ok=True)
with Image.open(root / 'assets' / 'runtime' / name) as icon:
    icon.convert('RGBA').save(target, sizes=[(n, n) for n in (16, 24, 32, 48, 64, 128, 256)])
print(f"{target.relative_to(root)}  <-  assets/runtime/{name[:12]}…")
