#!/usr/bin/env python3
"""A11y, appearance, RTL, and UX-structure extraction from Hermes disassembly."""
import re

DIS = '/home/z/my-project/apk_analysis/decoded/bundle.dis'
strings = []
pat = re.compile(r"# String: '((?:[^'\\]|\\.)*)' \((\w+)\)")
with open(DIS, encoding='utf-8', errors='replace') as f:
    for line in f:
        m = pat.search(line)
        if m:
            strings.append(m.group(1))
uniq = list(dict.fromkeys(strings))

def show(title, rx, limit=50, maxlen=70):
    hits = [s for s in uniq if re.search(rx, s) and len(s) < maxlen]
    print(f'\n=== {title} ({len(hits)}) ===')
    for s in hits[:limit]:
        print('  -', s.replace('\n', ' | ')[:maxlen])

show('ACCESSIBILITY PROPS', r'accessib', 60)
show('RTL', r'I18nManager|forceRTL|allowRTL|doLeftAndRightSwap', 20)
show('COLOR SCHEME / DARK MODE', r'useColorScheme|colorScheme|Appearance|prefers-color', 30)
show('STATUS BAR', r'StatusBar|statusBar', 25)
show('TAB ICONS/CONFIG', r'tabBar(icon|Label|Style|ShowLabel|Accessibility)', 25)
show('ANIMATIONS', r'(Reanimated|LayoutAnimation|Animated\.|withSpring|withTiming|useAnimatedStyle)', 30, 60)
show('HAPTICS/GESTURES', r'(haptic|HapticFeedback|swipe|Swipeable|panGesture)', 20, 60)
show('TOAST/ALERT', r'(Toast|Alert\.|showAlert|toast)', 20, 70)
show('PRESSABLE/OPACITY', r'(Pressable|TouchableOpacity|TouchableHighlight|Ripple)', 15, 50)
show('SPLASH', r'(SplashScreen|splash)', 15, 60)
show('HIT SLOP / SIZES', r'hitSlop', 10, 50)
