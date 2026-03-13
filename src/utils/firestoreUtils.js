/**
 * Safe Firestore listener wrapper to prevent assertion errors
 * Adds error handling and prevents race-condition crashes on page load
 */

export const safeOnSnapshot = (query, onNext, onError) => {
  let unsubscribe = null;
  let isActive = true;

  // Import onSnapshot dynamically to ensure Firestore is ready
  import('firebase/firestore').then(({ onSnapshot }) => {
    if (!isActive) return;
    
    try {
      unsubscribe = onSnapshot(
        query,
        (snapshot) => {
          if (isActive) {
            onNext?.(snapshot);
          }
        },
        (error) => {
          if (isActive) {
            // Log but don't crash on Firestore assertion errors
            if (error.code === 'internal' || error.message?.includes('ASSERTION')) {
              console.warn('Firestore stream error (will retry on next mount):', error.code);
              // Silently handle - listener will restart on navigation
            } else {
              console.error('Firestore listener error:', error);
              onError?.(error);
            }
          }
        }
      );
    } catch (err) {
      if (isActive) {
        console.error('Failed to set up listener:', err);
        onError?.(err);
      }
    }
  });

  // Return cleanup function
  return () => {
    isActive = false;
    unsubscribe?.();
  };
};
