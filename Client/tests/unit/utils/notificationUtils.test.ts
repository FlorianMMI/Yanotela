/**
 * Tests unitaires pour notificationUtils
 */

import { refreshNotifications, refreshNotificationsDebounced } from '@/utils/notificationUtils';

describe('notificationUtils', () => {
  
  beforeEach(() => {
    jest.useFakeTimers();
    window.dispatchEvent = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('refreshNotifications', () => {
    
    test('devrait dispatcher un événement refreshNotifications', () => {
      refreshNotifications();

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refreshNotifications',
        })
      );
    });

    test('ne devrait rien faire si window est undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(() => refreshNotifications()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('refreshNotificationsDebounced', () => {
    
    test('devrait debouncer les appels multiples', () => {
      refreshNotificationsDebounced(1000);
      refreshNotificationsDebounced(1000);
      refreshNotificationsDebounced(1000);

      expect(window.dispatchEvent).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);

      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test('devrait utiliser le délai par défaut de 1000ms', () => {
      refreshNotificationsDebounced();

      jest.advanceTimersByTime(999);
      expect(window.dispatchEvent).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test('devrait respecter un délai personnalisé', () => {
      refreshNotificationsDebounced(2000);

      jest.advanceTimersByTime(1999);
      expect(window.dispatchEvent).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test('devrait annuler les timeouts précédents', () => {
      refreshNotificationsDebounced(1000);
      jest.advanceTimersByTime(500);

      refreshNotificationsDebounced(1000);
      jest.advanceTimersByTime(500);

      // Premier timeout annulé, ne devrait pas dispatcher
      expect(window.dispatchEvent).not.toHaveBeenCalled();

      // Compléter le second timeout
      jest.advanceTimersByTime(500);
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test('devrait appeler refreshNotifications après le délai', () => {
      refreshNotificationsDebounced(500);

      jest.advanceTimersByTime(500);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refreshNotifications',
        })
      );
    });
  });
});
