# One-shot: under exactOptionalPropertyTypes, `x?: T` no longer accepts an
# explicit undefined. The ported code passes `prop={maybeUndefined}` everywhere,
# so optional members in type declarations become `x?: T | undefined` (the
# meaning they had before the flag). Only simple one-line members are touched.
import re, sys, pathlib
pat = re.compile(r"^(\t+)(readonly )?(\w+)\?: (.+?)(;?)$")
for f in sys.argv[1:]:
    p = pathlib.Path(f); lines = p.read_text().split("\n"); n = 0
    for i, ln in enumerate(lines):
        m = pat.match(ln)
        if not m: continue
        ind, ro, name, typ, semi = m.groups()
        t = typ.rstrip()
        if t.endswith("| undefined") or t.endswith("{") or t.endswith("(") or t.endswith("<") or t.endswith("|") or t.endswith(",") : continue
        if t.count("(") != t.count(")") or t.count("<") != t.replace("=>", "").count(">") or t.count("{") != t.count("}") or t.count("[") != t.count("]"): continue
        if "=>" in t: t = f"({t})"
        lines[i] = f"{ind}{ro or ''}{name}?: {t} | undefined{semi}"; n += 1
    p.write_text("\n".join(lines)); print(n, f)
