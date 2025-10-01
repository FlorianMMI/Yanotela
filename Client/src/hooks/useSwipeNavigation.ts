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

  // Détection mobile vs desktop - Version simplifiée pour tester
  useEffect(() => {
    const checkIsMobile = () => {
      const hasSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window;
      
      // Pour les tests, on active si écran petit OU device tactile
      const mobile = hasSmallScreen || isTouchDevice;
      console.log('Mobile detection:', { hasSmallScreen, isTouchDevice, mobile, width: window.innerWidth });
      setIsMobile(mobile);
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
    console.log('Touch start:', { x: touch.clientX, y: touch.clientY });
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

    console.log('Swipe detection:', {
      distanceX,
      distanceY,
      isLeftSwipe,
      isRightSwipe,
      isValidSwipe,
      minSwipeDistance,
      maxVerticalDistance,
      routes: config.routes
    });

    if (isValidSwipe) {
      if (isLeftSwipe && config.routes.right) {
        // Swipe vers la gauche -> aller à la route de droite
        console.log('Navigating right to:', config.routes.right);
        router.push(config.routes.right);
      } else if (isRightSwipe && config.routes.left) {
        // Swipe vers la droite -> aller à la route de gauche
        console.log('Navigating left to:', config.routes.left);
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

  console.log('Swipe handlers:', { isMobile, hasHandlers: Object.keys(swipeHandlers).length > 0 });

  return {
    isMobile,
    swipeHandlers
  };
};