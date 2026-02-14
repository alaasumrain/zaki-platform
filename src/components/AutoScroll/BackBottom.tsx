'use client';

/**
 * Back to Bottom Button Component
 * 
 * Based on LobeChat's BackBottom component
 * Shows a floating button to scroll back to bottom when user scrolls up
 * 
 * Usage:
 * ```tsx
 * <ChatContainer>
 *   <ChatList />
 *   <BackBottom 
 *     visible={!atBottom}
 *     onClick={() => scrollToBottom(true)}
 *   />
 * </ChatContainer>
 * ```
 */

import { memo } from 'react';
import { ArrowDown } from 'lucide-react';

export interface BackBottomProps {
  /**
   * Whether the button should be visible
   */
  visible?: boolean;
  
  /**
   * Click handler to scroll to bottom
   */
  onClick?: () => void;
  
  /**
   * Custom className
   */
  className?: string;
}

const BackBottom = memo<BackBottomProps>(({
  visible = false,
  onClick,
  className = '',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-20 right-6 z-50
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-blue-500 hover:bg-blue-600
        text-white shadow-lg
        transition-all duration-200
        hover:scale-110
        active:scale-95
        ${className}
      `}
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <ArrowDown className="w-5 h-5" />
    </button>
  );
});

BackBottom.displayName = 'BackBottom';

export default BackBottom;
