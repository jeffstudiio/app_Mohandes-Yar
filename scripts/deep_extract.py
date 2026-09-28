#!/usr/bin/env python3
"""Deep-dive: screens, tabs, fonts, palette, UI structure of Mohandesyar app."""
import re, json, collections

DIS = '/home/z/my-project/apk_analysis/decoded/bundle.dis'

strings = []
pat = re.compile(r"# String: '((?:[^'\\]|\\.)*)' \((\w+)\)")
with open(DIS, encoding='utf-8', errors='replace') as f:
    for line in f:
        m = pat.search(line)
        if m:
            strings.append(m.group(1))

uniq = list(dict.fromkeys(strings))

def unesc(s):
    try:
        return s.encode('utf-8', 'ignore').decode('unicode_escape', 'ignore')
    except Exception:
        return s

persian = [s for s in uniq if re.search(r'[\u0600-\u06FF]', s)]
print('=== ALL PERSIAN STRINGS (%d) ===' % len(persian))
for s in persian:
    print('  -', s[:150].replace('\n', ' | '))

# font-related
print('\n=== FONT REFS ===')
for s in uniq:
    if re.search(r'(font|Vazir|IRANSans|Yekan|Sahel|Poppins|Roboto)', s, re.I) and len(s) < 90:
        print('  -', s[:90])

# status bar / dark mode / rtl in JS
print('\n=== APPEARANCE / RTL ===')
for s in uniq:
    if re.search(r'(I18nManager|forceRTL|allowRTL|colorScheme|useColorScheme|StatusBar|dark|light)', s) and len(s) < 80:
        print('  -', s[:80])
