#!/usr/bin/env python3
"""Extract UI-relevant strings from Hermes disassembly (Mohandesyar app analysis)."""
import re, json

DIS = '/home/z/my-project/apk_analysis/decoded/bundle.dis'
OUT = '/home/z/my-project/apk_analysis/extracted.json'

strings = []
pat = re.compile(r"# String: '(.*?)' \((\w+)\)")
with open(DIS, encoding='utf-8', errors='replace') as f:
    for line in f:
        m = pat.search(line)
        if m:
            strings.append((m.group(1), m.group(2)))

uniq = list(dict.fromkeys(s for s, _ in strings))
print(f"total occurrences: {len(strings)}, unique strings: {len(uniq)}")

def is_persian(s):
    return bool(re.search(r'[\u0600-\u06FF]', s)) and len(s.strip()) > 1

persian = [s for s in uniq if is_persian(s)]
colors = [s for s in uniq if re.fullmatch(r'#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})', s)]
urls = [s for s in uniq if re.match(r'https?://', s)]
fonts = [s for s in uniq if re.search(r'\.(ttf|otf|woff2?)$', s, re.I)]

nav_patterns = [s for s in uniq if re.search(r'(createNativeStackNavigator|createBottomTabNavigator|createStackNavigator|createDrawerNavigator|NavigationContainer|react-navigation|expo-router)', s, re.I)]

libs = {}
for key in ['react-native-reanimated', 'react-native-gesture-handler', 'react-native-screens',
            'react-native-safe-area', 'react-native-vector-icons', '@expo/vector-icons',
            'lottie', 'react-native-svg', 'react-native-webview', 'react-native-fast-image',
            'react-native-image-picker', 'expo-image-picker', 'expo-notifications', 'expo-sqlite',
            'expo-font', 'react-native-paper', 'native-base', 'react-native-elements',
            'expo-linear-gradient', 'react-native-toast', 'expo-av', 'expo-video', 'expo-haptics',
            'expo-file-system', 'expo-linking', 'expo-web-browser', 'react-native-pdf', 'expo-print',
            'expo-sharing', 'expo-clipboard', 'react-native-markdown', 'react-native-purchases',
            'react-native-iap', 'expo-in-app-purchases', 'expo-camera', 'expo-contacts',
            'redux', 'zustand', 'mobx', '@tanstack/react-query', 'axios', 'react-query',
            'react-native-bouncy', 'expo-splash-screen', 'expo-status-bar', 'react-native-pager',
            'react-native-calendars', 'react-native-toast-message', 'shopify/flash-list',
            'flash-list', 'react-native-keyboard', 'expo-image', 'react-native-mmkv',
            'async-storage', 'expo-secure-store', 'react-native-safe-area-context']:
    found = [s for s in uniq if key.lower() in s.lower()]
    if found:
        libs[key] = True

persian_sorted = sorted(persian, key=len)
result = {
    'counts': {'unique_strings': len(uniq), 'persian_strings': len(persian), 'colors': len(colors), 'urls': len(urls)},
    'persian': persian,
    'colors': sorted(set(colors)),
    'urls': sorted(set(urls))[:40],
    'fonts': sorted(set(fonts)),
    'nav': sorted(set(nav_patterns))[:40],
    'libs': sorted(libs.keys()),
}
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

print('persian strings:', len(persian))
print('colors found:', len(set(colors)))
print('sample persian (longest 30):')
for s in sorted(persian, key=len, reverse=True)[:30]:
    print('   ', repr(s[:110]))
print('sample colors:', sorted(set(colors))[:60])
print('nav hits:', sorted(set(nav_patterns))[:25])
print('libs:', sorted(libs.keys()))
