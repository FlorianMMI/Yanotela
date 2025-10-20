import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TouchPosition {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

interface SwipeConfig {
  minSwipeDistance?: number;
  maxVerticalDistance?: number;
  enableMouse?: boolean;
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
  const [mouseStart, setMouseStart] = useState<MousePosition | null>(null);
  const [mouseEnd, setMouseEnd] = useState<MousePosition | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const minSwipeDistance = config.minSwipeDistance || 50;
  const maxVerticalDistance = config.maxVerticalDistance || 100;
  const enableMouse = config.enableMouse !== false; // Par défaut activé

  // Détection mobile vs desktop - Version simplifiée pour tester
  useEffect(() => {
    const checkIsMobile = () => {
      const hasSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window;
      
      // Pour les tests, on active si écran petit OU device tactile
      const mobile = hasSmallScreen || isTouchDevice;
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Fonction utilitaire pour naviguer
  const navigate = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left' && config.routes.left) {
      router.push(config.routes.left);
    } else if (direction === 'right' && config.routes.right) {
      router.push(config.routes.right);
    }
  }, [config.routes, router]);

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
      if (isLeftSwipe) {
        navigate('right'); // Swipe vers la gauche -> aller à droite
      } else if (isRightSwipe) {
        navigate('left'); // Swipe vers la droite -> aller à gauche
      }
    }

    // Reset
    setTouchStart(null);
    setTouchEnd(null);
  }, [isMobile, touchStart, touchEnd, minSwipeDistance, maxVerticalDistance, navigate]);

  // Gestionnaires pour la souris
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableMouse) return;
    
    setIsMouseDown(true);
    setMouseEnd(null);
    setMouseStart({
      x: e.clientX,
      y: e.clientY
    });
  }, [enableMouse]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableMouse || !isMouseDown || !mouseStart) return;
    
    setMouseEnd({
      x: e.clientX,
      y: e.clientY
    });
  }, [enableMouse, isMouseDown, mouseStart]);

  const onMouseUp = useCallback(() => {
    if (!enableMouse || !isMouseDown || !mouseStart || !mouseEnd) return;

    const distanceX = mouseStart.x - mouseEnd.x;
    const distanceY = Math.abs(mouseStart.y - mouseEnd.y);
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isValidSwipe = distanceY < maxVerticalDistance;

    if (isValidSwipe) {
      if (isLeftSwipe) {
        navigate('right'); // Drag vers la gauche -> aller à droite
      } else if (isRightSwipe) {
        navigate('left'); // Drag vers la droite -> aller à gauche
      }
    }

    // Reset
    setIsMouseDown(false);
    setMouseStart(null);
    setMouseEnd(null);
  }, [enableMouse, isMouseDown, mouseStart, mouseEnd, minSwipeDistance, maxVerticalDistance, navigate]);

  // Gestionnaires d'événements
  const swipeHandlers = {
    // Touch events (mobile)
    ...(isMobile ? {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    } : {}),
    // Mouse events (desktop)
    ...(enableMouse ? {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp // Reset si la souris sort de la zone
    } : {})
  };

  return {
    isMobile,
    swipeHandlers
  };
};