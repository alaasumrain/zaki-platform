# AutoScroll Component

Auto-scrolling component for chat interfaces, based on LobeChat's implementation.

## Components

### `AutoScroll`
Main component that handles auto-scrolling logic during AI generation.

**Props:**
- `isGenerating?: boolean` - Whether AI is generating
- `atBottom?: boolean` - Whether user is at bottom
- `isScrolling?: boolean` - Whether user is scrolling
- `scrollToBottom?: (smooth?: boolean) => void` - Scroll function
- `lastMessageLength?: number` - Last message length (for streaming)
- `threshold?: number` - At-bottom threshold (default: 300px)
- `debug?: boolean` - Enable debug logging

**Usage:**
```tsx
import AutoScroll from '@/components/AutoScroll';

<ChatList>
  {messages.map(msg => <Message key={msg.id} {...msg} />)}
  <AutoScroll
    isGenerating={isGenerating}
    atBottom={atBottom}
    isScrolling={isScrolling}
    scrollToBottom={scrollToBottom}
    lastMessageLength={lastMessage?.content?.length || 0}
  />
</ChatList>
```

### `BackBottom`
Floating button to scroll back to bottom when user scrolls up.

**Props:**
- `visible?: boolean` - Whether button is visible
- `onClick?: () => void` - Click handler
- `className?: string` - Custom styles

**Usage:**
```tsx
import BackBottom from '@/components/AutoScroll/BackBottom';

<ChatContainer>
  <ChatList />
  <BackBottom
    visible={!atBottom}
    onClick={() => scrollToBottom(true)}
  />
</ChatContainer>
```

## How It Works

1. **Auto-scroll triggers when:**
   - User is at bottom (`atBottom === true`)
   - AI is generating (`isGenerating === true`)
   - User is not manually scrolling (`isScrolling === false`)

2. **Streaming detection:**
   - Monitors `lastMessageLength` for changes
   - Scrolls on each update during streaming

3. **Back to bottom button:**
   - Shows when user scrolls up (`!atBottom`)
   - Clicking scrolls smoothly to bottom

## Integration Notes

This component is framework-agnostic but designed for React. For other frameworks:

- **Vue**: Convert to Vue 3 Composition API
- **Svelte**: Convert to Svelte component
- **Vanilla JS**: Use event listeners and DOM manipulation

## Source

Based on LobeChat's implementation:
- `/root/zaki-dashboard/src/features/Conversation/ChatList/components/AutoScroll/index.tsx`
