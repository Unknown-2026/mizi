import type { ImageSourcePropType } from 'react-native';

export const authColors = {
  background: '#FFFEFB',
  brand: '#2F976F',
  primary: '#2D8087',
  kakao: '#FEE500',
  text: '#111111',
  muted: '#687174',
  white: '#FFFFFF',
  highlight: '#FFE500',
};

export type OnboardingStep = {
  id: string;
  image: ImageSourcePropType;
  title: {
    text: string;
    color?: string;
  }[];
  description: string;
};

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'photo',
    image: require('@/assets/images/auth/onboarding-photo.png'),
    title: [
      { text: '사진 한 장에서\n' },
      { text: '여행이 시작', color: authColors.brand },
      { text: '돼요' },
    ],
    description: '공모전 사진 속 숨겨진 장소를\n단서없이 직접 찾아 떠나보세요.',
  },
  {
    id: 'hint',
    image: require('@/assets/images/auth/onboarding-hint.png'),
    title: [
      { text: '막히면\n' },
      { text: '힌트', color: authColors.brand },
      { text: '를 열어보세요' },
    ],
    description: '장소를 바로 알려주진 않지만,\n방향을 잡을 작은 단서를 드려요.',
  },
  {
    id: 'proof',
    image: require('@/assets/images/auth/onboarding-proof.png'),
    title: [
      { text: '도착했다면\n' },
      { text: '같은 구도로', color: authColors.brand },
      { text: ' 찍어보세요' },
    ],
    description: '원본 사진과 내 사진을 비교해서\n싱크로율을 확인해요.',
  },
];

export const loginCopy = {
  headline: {
    prefix: '나만의 ',
    highlight: '탐험 카드',
    suffix: '를\n수집하세요',
  },
  description: '탐험을 완료하면 장소, 점수, 사진이 담긴\n카드가 내 컬렉션에 저장돼요.',
  kakaoButton: '카카오로 시작하기',
  terms: '계속하면 이용약관 및 개인정보처리방침에 동의하게 됩니다',
};

export const authImages = {
  loginHeroCard: require('@/assets/images/auth/login-explorer-card.png'),
};
