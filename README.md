# Ruko Learning World 🤖📚

An intelligent, adaptive educational platform for children built with React Native and powered by Google's Gemini AI. Features an animated companion character (Ruko) that guides learners through interactive science, coding, and history lessons.

## 🏗️ Architecture Overview

### Tech Stack

**Frontend Framework:**
- React Native (Expo SDK)
- TypeScript
- NativeWind (Tailwind CSS for React Native)

**State Management:**
- Zustand with AsyncStorage persistence
- Custom hooks for emotion state management

**Animation Libraries:**
- React Native Reanimated 2
- React Native SVG
- Expo Linear Gradient

**AI Integration:**
- Google Generative AI SDK (Gemini 1.5 Flash)
- Dual model approach: thinking model for chat, audio model for voice

**Audio/Media:**
- Expo AV for audio recording and playback
- Expo File System for base64 encoding

## 🎯 Core Features

### 1. **Adaptive AI Companion (Ruko)**

The `LivingRuko` component is a highly sophisticated animated character system:

**Technical Implementation:**
```typescript
// src/components/ruko/LivingRuko.tsx
- 11 distinct emotion states with micro-variations
- Real-time mouse/touch tracking using PanResponder
- Dual animation system:
  * React Native Reanimated for smooth transforms
  * Standard Animated API for tear drops (avoiding Android crashes)
- SVG-based rendering with transform-origin pivoting
- Breathing, blinking, and idle animations
```

**Key Technical Challenges Solved:**
- **Android Matrix Glitch Fix:** Implemented manual transform-origin simulation using translate-rotate-inverse-translate pattern
- **Tear Drop Animation:** Used `useNativeDriver: false` to prevent rapid node unmounting crashes
- **Cross-platform Mouse Tracking:** Web-specific global mouse listener with RAF-based updates

### 2. **Interactive Educational Games**

#### Photosynthesis Game (`PhotosynthesisGame.tsx`)
- **Drag-and-drop mechanics** using PanResponder with collision detection
- **Multi-phase gameplay:** Sunlight positioning → Water tapping → CO2 balancing → Quiz
- **Real-time particle systems** for water drops and CO2 bubbles
- **Difficulty scaling** based on user level (easy/medium/hard)
- **Mistake tracking** with educational feedback

#### Coding Game (`CodingGame.tsx`)
- **Visual programming** with block-based commands (UP, DOWN, LEFT, RIGHT)
- **Grid-based pathfinding** with obstacle detection
- **Sequential execution visualization** with step-by-step highlighting
- **Coin collection mechanics** for bonus XP
- **5 progressive levels** with increasing complexity

### 3. **AI-Powered Chat System**

**Dual Implementation Pattern:**
```
chatAI.ts      → Native mobile (Gemini API)
chatAI.web.ts  → Web fallback (mock responses)
```

**Features:**
- Context-aware responses based on:
  - User age and level
  - Current topic and class
  - Conversation history (last 6 messages)
  - Recent lessons completed
- Safety filtering for inappropriate content
- Emotion detection in responses
- Suggested questions generation
- Follow-up question handling

**AI Prompt Engineering:**
```typescript
const getSystemPrompt = (context: ChatContext): string => {
  // Age-appropriate language
  // Class-specific knowledge base
  // Personality consistency
  // Safety guardrails
}
```

### 4. **Gamification System**

**XP & Leveling (`userStore.ts`):**
```typescript
// Formula: level = floor(sqrt(totalXP / 100)) + 1
// Next level XP: (level + 1)^2 * 100

// Quadratic scaling ensures:
// - Level 1→2: 400 XP
// - Level 5→6: 3,600 XP
// - Level 10→11: 12,100 XP
```

**Progress Tracking:**
- Per-class completion tracking
- Quiz score history
- Achievement system with unlock conditions
- Streak tracking with date-based validation
- Coin economy for future cosmetics/rewards

### 5. **Voice Teaching Mode**

**Audio Recording Pipeline:**
```typescript
// useAudioRecorder.ts
1. Request microphone permissions
2. Start recording (HIGH_QUALITY preset)
3. Stop and retrieve URI
4. Convert to base64 (FileSystem.readAsStringAsync)
5. Send to Gemini audio model
```

**Gemini Multimodal Integration:**
```typescript
audioModel.generateContent([
  prompt,
  { inlineData: { mimeType: "audio/mp3", data: base64 } }
])
```

## 📁 Project Structure

```
src/
├── components/
│   └── ruko/
│       ├── LivingRuko.tsx        # 500+ line animated character
│       └── RukoAvatar.tsx        # Wrapper component
├── features/
│   ├── science-class/
│   │   └── PhotosynthesisGame.tsx
│   ├── coding-class/
│   │   └── CodingGame.tsx
│   └── chat/
│       └── RukoChat.tsx
├── hooks/
│   ├── useRukoEmotion.ts         # Emotion state management
│   └── useAudioRecorder.ts       # Audio recording logic
├── services/
│   └── ai/
│       ├── chatAI.ts             # Gemini chat integration
│       ├── chatAI.web.ts         # Web fallback
│       ├── educationAI.ts        # Quiz/lesson generation
│       ├── educationAI.web.ts    # Web fallback
│       └── teachRuko.ts          # Voice teaching mode
└── store/
    └── userStore.ts              # Zustand state with persistence
```

## 🔧 Configuration Files

### Metro Config (`metro.config.js`)
```javascript
// Enables modern ESM modules
resolver.sourceExts.push("mjs", "cjs");
resolver.unstable_enablePackageExports = true;
```

### NativeWind Setup
```javascript
// babel.config.js
presets: [
  ["babel-preset-expo", { jsxImportSource: "nativewind" }],
  "nativewind/babel"
]

// tailwind.config.js
presets: [require("nativewind/preset")]
```

## 🎨 Animation Techniques

### Reanimated Patterns Used

1. **Breathing Animation:**
```typescript
breathY.value = withRepeat(
  withSequence(
    withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
    withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
  ), -1, true
);
```

2. **Blinking with Random Intervals:**
```typescript
const scheduleBlink = () => {
  setTimeout(() => {
    blinkState.value = withSequence(
      withTiming(0.1, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    scheduleBlink();
  }, 2000 + Math.random() * 4000);
};
```

3. **Mouse Tracking (Web):**
```typescript
const updateMouseTracking = () => {
  containerRef.current.measureInWindow((x, y, width, height) => {
    const offsetX = (mouseX - centerX) / (SCREEN_WIDTH / 2);
    eyeX.value = withSpring(offsetX * 3, { damping: 20 });
  });
  requestAnimationFrame(updateMouseTracking);
};
```

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.x
npm or yarn
expo-cli
```

### Environment Variables
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key
EXPO_PUBLIC_GEMINI_THINKING_MODEL=gemini-1.5-flash
EXPO_PUBLIC_GEMINI_AUDIO_MODEL=gemini-1.5-flash
```

### Installation
```bash
git clone https://github.com/MatthewNader2/ruko-learning-world.git
cd ruko-learning-world
npm install
```

### Development
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🧪 Technical Highlights

### Performance Optimizations

1. **Animated Component Memoization:**
   - Used `Animated.createAnimatedComponent` for SVG elements
   - Prevents re-renders on parent state changes

2. **Ref-Based Position Tracking:**
   - Avoided stale closures in PanResponder callbacks
   - Used `useRef` for position state in animations

3. **Platform-Specific Code Splitting:**
   - `.ts` and `.web.ts` file pattern
   - Metro automatically resolves based on platform

4. **Lazy Animation Cancellation:**
   - Cleanup in `useEffect` return functions
   - Prevents memory leaks on unmount

### AI Prompt Engineering Strategies

1. **Context Window Management:**
   - Limited conversation history to last 6 messages
   - Prevents token limit issues
   - Maintains relevant context

2. **JSON-First Responses:**
   - Requested JSON in prompts for structured data
   - Used regex extraction for markdown code blocks
   - Fallback to mock data on parse errors

3. **Age-Appropriate Language:**
   - Dynamic prompt templates based on `userAge`
   - Short response constraints (2-4 sentences)
   - Emoji usage for engagement

## 🔐 Safety Features

- **Content Filtering:** Pre-AI safety checks for inappropriate terms
- **Scientific Context Awareness:** Allows "death" in "star death" but not violence
- **Graceful Degradation:** Web fallbacks for all AI features
- **Error Boundaries:** Try-catch wrappers on all AI calls

## 📊 State Management Architecture

**Zustand Store Pattern:**
```typescript
// Atomic actions
addXP(amount) → calculates level, awards bonus coins
updateClassProgress(classId, lessonId) → tracks completion & stats
unlockAchievement(achievement) → prevents duplicates, awards coins

// Derived state via hooks
useUserLevel() → calculates progress percentage
useClassProgress(classId) → returns specific class data
```

**Persistence Layer:**
```typescript
persist(store, {
  name: 'user-store',
  storage: createJSONStorage(() => AsyncStorage)
})
```

## 🎯 Future Technical Roadmap

- [ ] **Offline Mode:** Cache AI responses with IndexedDB
- [ ] **Real-time Multiplayer:** WebSocket-based co-learning
- [ ] **TTS Integration:** Voice synthesis for Ruko's dialogue
- [ ] **3D Avatar Upgrade:** Three.js or React Three Fiber
- [ ] **Analytics Dashboard:** Parent/teacher progress tracking
- [ ] **Custom Skill Trees:** Branching lesson paths
- [ ] **AR Experiments:** Expo AR for science visualizations

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Google Generative AI team for Gemini models
- Expo team for excellent React Native tooling
- NativeWind for Tailwind CSS integration
- React Native Reanimated for performant animations

---

**Built with ❤️ for curious young minds**
