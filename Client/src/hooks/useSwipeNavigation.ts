import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeConfig {
  minSwipeDistance?: number;
  maxVerticalDistance?: number;
  routes: {
    current: string;
    left: string;  // Route quand on swipe vers la droite (va vers la gauche)
    right: string; // Route quand on swipe vers la gauche (va vers la droite)
  };
}

export const useSwipeNavigation = (config: SwipeConfig) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);

  const minSwipeDistance = config.minSwipeDistance || 50;
  const maxVerticalDistance = config.maxVerticalDistance || 100;

  // Détection mobile vs desktop
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent;
      const isTouchDevice = 'ontouchstart' in window;
      const hasSmallScreen = window.innerWidth <= 768;
      
      // Détection des appareils mobiles par user agent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(userAgent);
      
      setIsMobile(isMobileUA || (isTouchDevice && hasSmallScreen));
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    setTouchEnd(null);
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  }, [isMobile]);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !touchStart) return;
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY
    });
  }, [isMobile, touchStart]);

  const onTouchEnd = useCallback(() => {
    if (!isMobile || !touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isValidSwipe = distanceY < maxVerticalDistance;

    if (isValidSwipe) {
      if (isLeftSwipe && config.routes.right) {
        // Swipe vers la gauche -> aller à la route de droite
        router.push(config.routes.right);
      } else if (isRightSwipe && config.routes.left) {
        // Swipe vers la droite -> aller à la route de gauche
        router.push(config.routes.left);
      }
    }

    // Reset
    setTouchStart(null);
    setTouchEnd(null);
  }, [isMobile, touchStart, touchEnd, minSwipeDistance, maxVerticalDistance, config.routes, router]);

  // Gestionnaires d'événements
  const swipeHandlers = isMobile ? {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  } : {};

  return {
    isMobile,
    swipeHandlers
  };
};