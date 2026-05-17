import { Boogaloo_400Regular } from '@expo-google-fonts/boogaloo';
import {
  Cause_300Light,
  Cause_400Regular,
  Cause_500Medium,
  Cause_600SemiBold,
  Cause_700Bold,
} from '@expo-google-fonts/cause';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Urbanist_300Light,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';

export const FontFamily = {
  brand: 'Boogaloo-Regular',
  heading: {
    light:    'Cause-Light',
    regular:  'Cause-Regular',
    medium:   'Cause-Medium',
    semibold: 'Cause-SemiBold',
    bold:     'Cause-Bold',
  },
  body: {
    light:    'Urbanist-Light',
    regular:  'Urbanist-Regular',
    medium:   'Urbanist-Medium',
    semibold: 'Urbanist-SemiBold',
    bold:     'Urbanist-Bold',
  },
  mono: {
    regular: 'JetBrainsMono-Regular',
    medium:  'JetBrainsMono-Medium',
  },
} as const;

export const FONT_MAP = {
  'Boogaloo-Regular':       Boogaloo_400Regular,
  'Cause-Light':            Cause_300Light,
  'Cause-Regular':          Cause_400Regular,
  'Cause-Medium':           Cause_500Medium,
  'Cause-SemiBold':         Cause_600SemiBold,
  'Cause-Bold':             Cause_700Bold,
  'Urbanist-Light':         Urbanist_300Light,
  'Urbanist-Regular':       Urbanist_400Regular,
  'Urbanist-Medium':        Urbanist_500Medium,
  'Urbanist-SemiBold':      Urbanist_600SemiBold,
  'Urbanist-Bold':          Urbanist_700Bold,
  'JetBrainsMono-Regular':  JetBrainsMono_400Regular,
  'JetBrainsMono-Medium':   JetBrainsMono_500Medium,
} as const;
