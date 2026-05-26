import { useWindowDimensions } from 'react-native';

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.mobile,
    isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
    isDesktop: width >= BREAKPOINTS.tablet,
    isLandscape: width > height,
  };
};

export default useResponsive;
