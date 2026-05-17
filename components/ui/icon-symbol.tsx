// Fallback for Android and web — maps SF Symbol names to Material Icons.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'xmark': 'close',
  'xmark.circle.fill': 'cancel',

  // Kario tabs
  'book.fill': 'menu-book',
  'bubble.left.and.bubble.right.fill': 'forum',
  'checkmark.shield.fill': 'verified-user',
  'chart.bar.fill': 'bar-chart',
  'person.fill': 'person',

  // Journal actions
  'plus': 'add',
  'square.and.pencil': 'edit',
  'trash': 'delete',
  'square.and.arrow.up': 'share',
  'ellipsis': 'more-horiz',
  'ellipsis.circle': 'more-horiz',
  'magnifyingglass': 'search',

  // Emotions / status
  'face.smiling': 'sentiment-satisfied',
  'face.dashed': 'sentiment-neutral',
  'exclamationmark.triangle.fill': 'warning',
  'checkmark.circle.fill': 'check-circle',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'tag.fill': 'label',

  // Settings
  'gear': 'settings',
  'bell.fill': 'notifications',
  'lock.fill': 'lock',
  'info.circle': 'info',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
