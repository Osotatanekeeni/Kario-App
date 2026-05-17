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

// ---------------------------------------------------------------------------
// Font family name strings
//
// Each weight is registered as a distinct family name so React Native can
// correctly resolve it cross-platform (Android ignores fontWeight on custom
// fonts — the only reliable way is separate family name per weight).
// ---------------------------------------------------------------------------

export const FontFamily = {
  /** Boogaloo — branding, major metrics, P/L displays */
  brand: 'Boogaloo-Regular',

  /** Cause Variable — headings, tabs, navigation, hierarchy */
  heading: {
    light:    'Cause-Light',
    regular:  'Cause-Regular',
    medium:   'Cause-Medium',
    semibold: 'Cause-SemiBold',
    bold:     'Cause-Bold',
  },

  /** Urbanist — body text, forms, descriptions, readable content */
  body: {
    light:    'Urbanist-Light',
    regular:  'Urbanist-Regular',
    medium:   'Urbanist-Medium',
    semibold: 'Urbanist-SemiBold',
    bold:     'Urbanist-Bold',
  },

  /** JetBrains Mono — statistics, R:R values, timestamps, analytics */
  mono: {
    regular: 'JetBrainsMono-Regular',
    medium:  'JetBrainsMono-Medium',
  },
} as const;

// ---------------------------------------------------------------------------
// Font map — passed directly to useFonts()
// ---------------------------------------------------------------------------

export const FONT_MAP = {
  // Brand
  'Boogaloo-Regular':     Boogaloo_400Regular,

  // Heading
  'Cause-Light':          Cause_300Light,
  'Cause-Regular':        Cause_400Regular,
  'Cause-Medium':         Cause_500Medium,
  'Cause-SemiBold':       Cause_600SemiBold,
  'Cause-Bold':           Cause_700Bold,

  // Body
  'Urbanist-Light':       Urbanist_300Light,
  'Urbanist-Regular':     Urbanist_400Regular,
  'Urbanist-Medium':      Urbanist_500Medium,
  'Urbanist-SemiBold':    Urbanist_600SemiBold,
  'Urbanist-Bold':        Urbanist_700Bold,

  // Mono
  'JetBrainsMono-Regular': JetBrainsMono_400Regular,
  'JetBrainsMono-Medium':  JetBrainsMono_500Medium,
} as const;
