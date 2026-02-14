'use client';

/**
 * AutoScroll Component
 * 
 * Based on LobeChat's AutoScroll component
 * Handles auto-scrolling logic during AI generation
 * 
 * This component should be placed inside the chat list container
 * and will automatically scroll to bottom when:
 * - User is at bottom of chat
 * - AI is generating a response
 * - User is not manually scrolling
 * 
 * Usage:
 * ```tsx
 * <ChatList>
 *   {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *   <AutoScroll />
 * </ChatList>
 * ```
 */

import { memo, useEffect, useRef } from 'react';

export interface AutoScrollProps {
  /**
   * Whether AI is currently generating a response
   */
  isGenerating?: boolean;
  
  /**
   * Whether user is at the bottom of the chat
   */
  atBottom?: boolean;
  
  /**
   * Whether user is currently scrolling
   */
  isScrolling?: boolean;
  
  /**
   * Function to scroll to bottom
   */
  scrollToBottom?: (smooth?: boolean) => void;
  
  /**
   * Last message content length (for detecting streaming updates)
   */
  lastMessageLength?: number;
  
  /**
   * Threshold in pixels for "at bottom" detection
   * Default: 300px
   */
  threshold?: number;
  
  /**
   * Enable debug mode (shows scroll position info)
   */
  debug?: boolean;
}

/**
 * Default threshold for "at bottom" detection (in pixels)
 */
export const AT_BOTTOM_THRESHOLD = 300;

const AutoScroll = memo<AutoScrollProps>(({
  isGenerating = false,
  atBottom = true,
  isScrolling = false,
  scrollToBottom,
  lastMessageLength = 0,
  threshold = AT_BOTTOM_THRESHOLD,
  debug = false,
}) => {
  const shouldAutoScroll = atBottom && isGenerating && !isScrolling;
  const lastLengthRef = useRef(lastMessageLength);

  useEffect(() => {
    if (shouldAutoScroll && scrollToBottom) {
      scrollToBottom(false); // false = instant scroll (better for streaming)
    }
  }, [shouldAutoScroll, scrollToBottom, lastMessageLength]);

  // Update ref when message length changes (streaming)
  useEffect(() => {
    if (lastMessageLength !== lastLengthRef.current) {
      lastLengthRef.current = lastMessageLength;
      if (shouldAutoScroll && scrollToBottom) {
        scrollToBottom(false);
      }
    }
  }, [lastMessageLength, shouldAutoScroll, scrollToBottom]);

  // Debug output (only in development)
  if (debug && typeof window !== 'undefined') {
    console.log('[AutoScroll]', {
      isGenerating,
      atBottom,
      isScrolling,
      shouldAutoScroll,
      lastMessageLength,
    });
  }

  // No visual output - this component only handles auto-scroll logic
  return null;
});

AutoScroll.displayName = 'AutoScroll';

export default AutoScroll;
