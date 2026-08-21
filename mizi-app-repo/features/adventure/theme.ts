import { Dimensions } from 'react-native';

export { palette } from '@/constants/theme';

// TODO: Replace this static reference with the active adventure destination image.
export const destinationImage = require('@/assets/images/adventure/destination-reference.png');

const { width } = Dimensions.get('window');

export const compassSize = Math.min(width - 54, 330);
