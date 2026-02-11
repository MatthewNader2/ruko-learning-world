// src/features/coding-class/CodingGame.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import LivingRuko from "../../components/ruko/LivingRuko";
import { useUserStore } from "../../store/userStore";
import { useRukoEmotion } from "../../hooks/useRukoEmotion";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = 6;
const CELL_SIZE = Math.floor((Math.min(SCREEN_WIDTH, 500) - 48) / GRID_SIZE);

type CommandType = "UP" | "DOWN" | "LEFT" | "RIGHT" | "COLLECT";
type BlockType = CommandType | "LOOP" | "IF" | "FUNCTION" | "WAIT" | "BREAK";

interface Block {
  id: string;
  type: BlockType;
  value?: number; // For loop count
  condition?: "WALL_AHEAD" | "GOAL_AHEAD" | "ITEM_HERE"; // For if/else
  children?: Block[]; // For loops and conditionals
  functionName?: string; // For functions
  parentId?: string; // Track parent for nesting
}

interface CollectibleItem {
  x: number;
  y: number;
  type: "coin" | "gem" | "key";
  collected: boolean;
}

interface LevelData {
  id: number;
  name: string;
  concept: string;
  tutorial: string;
  detailedInstructions: string[];
  maxBlocks: number;
  hasWalls: boolean;
  availableBlocks: BlockType[];
  requiredConcept?: "sequence" | "loop" | "conditional" | "function" | "mixed";
  collectibles?: number;
  customGoal?: (
    playerPos: { x: number; y: number },
    items: CollectibleItem[],
    goalPos: { x: number; y: number },
  ) => boolean;
  hints?: string[];
}

const LEVELS: LevelData[] = [
  // SECTION 1: Introduction to Sequences (Levels 1-3)
  {
    id: 1,
    name: "First Steps",
    concept: "Basic Movement",
    tutorial: "Welcome! Move Ruko to the battery.",
    detailedInstructions: [
      "Click the arrow buttons to add moves",
      "Each arrow moves Ruko one space",
      "Click Run to execute your program",
      "Goal: Reach the battery 🔋",
    ],
    maxBlocks: 4,
    hasWalls: false,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT"],
    requiredConcept: "sequence",
    hints: ["The battery is 2 spaces to the right", "Use 2 RIGHT arrows"],
  },
  {
    id: 2,
    name: "Two Turns",
    concept: "Sequences",
    tutorial: "Navigate around! Use multiple directions.",
    detailedInstructions: [
      "You'll need to move in different directions",
      "Plan your path to avoid going off the grid",
      "The order of moves matters!",
    ],
    maxBlocks: 6,
    hasWalls: false,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT"],
    requiredConcept: "sequence",
  },
  {
    id: 3,
    name: "The Long Path",
    concept: "Longer Sequences",
    tutorial: "This requires many moves in sequence.",
    detailedInstructions: [
      "Notice how many blocks you're using",
      "When you use the same move multiple times...",
      "...wouldn't a shortcut be nice?",
      "Complete this level to unlock LOOPS! 🔄",
    ],
    maxBlocks: 12,
    hasWalls: false,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT"],
    requiredConcept: "sequence",
  },

  // SECTION 2: Introduction to Loops (Levels 4-7)
  {
    id: 4,
    name: "Repeat Discovery",
    concept: "Loop Introduction",
    tutorial: "Try the new LOOP block! Same path, fewer blocks.",
    detailedInstructions: [
      "🎉 NEW BLOCK UNLOCKED: LOOP (Repeat)",
      "The LOOP block repeats moves multiple times",
      "Instead of: RIGHT RIGHT RIGHT RIGHT",
      "Use: LOOP 4× containing RIGHT",
      "Tap a LOOP block to set how many times to repeat",
      "Drag moves INTO the loop block",
    ],
    maxBlocks: 8,
    hasWalls: false,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT", "LOOP"],
    requiredConcept: "loop",
    hints: [
      "Use LOOP 4× with RIGHT inside",
      "You can combine loops with regular moves",
    ],
  },
  {
    id: 5,
    name: "Nested Journey",
    concept: "Loop Mastery",
    tutorial: "Use multiple loops efficiently!",
    detailedInstructions: [
      "This path has repeating patterns",
      "Break it into smaller loops",
      "Example: Move right 3×, then up 3×",
    ],
    maxBlocks: 6,
    hasWalls: false,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT", "LOOP"],
    requiredConcept: "loop",
  },
  {
    id: 6,
    name: "Obstacle Course",
    concept: "Walls & Loops",
    tutorial: "Walls appear! Plan carefully with loops.",
    detailedInstructions: [
      "⚠️ NEW: Walls block your path",
      "Hitting a wall wastes a move",
      "Plan your route to avoid walls",
      "Loops are still useful here!",
    ],
    maxBlocks: 8,
    hasWalls: true,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT", "LOOP"],
    requiredConcept: "loop",
  },
  {
    id: 7,
    name: "Collector",
    concept: "Multiple Goals",
    tutorial: "Collect all coins, then reach the battery!",
    detailedInstructions: [
      "🪙 NEW: Collectible items!",
      "Use COLLECT to pick up items",
      "You must collect ALL items before reaching the goal",
      "Plan your route efficiently",
    ],
    maxBlocks: 15,
    hasWalls: false,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT", "COLLECT", "LOOP"],
    collectibles: 3,
    customGoal: (playerPos, items, goalPos) => {
      return (
        items.every((item) => item.collected) &&
        playerPos.x === goalPos.x &&
        playerPos.y === goalPos.y
      );
    },
  },

  // SECTION 3: Conditionals (Levels 8-11)
  {
    id: 8,
    name: "Smart Decisions",
    concept: "IF Blocks",
    tutorial: "Sometimes you need to make decisions!",
    detailedInstructions: [
      "🎉 NEW BLOCK: IF (Conditional)",
      "IF blocks execute moves only when a condition is true",
      "IF ITEM_HERE → COLLECT",
      "This picks up items automatically!",
      "Tap an IF block to choose its condition",
    ],
    maxBlocks: 10,
    hasWalls: false,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT", "COLLECT", "LOOP", "IF"],
    requiredConcept: "conditional",
    collectibles: 2,
    customGoal: (playerPos, items, goalPos) => {
      return (
        items.every((item) => item.collected) &&
        playerPos.x === goalPos.x &&
        playerPos.y === goalPos.y
      );
    },
    hints: [
      "Use IF ITEM_HERE with COLLECT inside",
      "You don't need to know exactly where items are!",
    ],
  },
  {
    id: 9,
    name: "Wall Detection",
    concept: "IF with Obstacles",
    tutorial: "Detect walls before hitting them!",
    detailedInstructions: [
      "IF WALL_AHEAD lets you detect walls",
      "Make smart turns to avoid obstacles",
      "Combine IF blocks with different directions",
    ],
    maxBlocks: 12,
    hasWalls: true,
    availableBlocks: ["UP", "DOWN", "LEFT", "RIGHT", "LOOP", "IF"],
    requiredConcept: "conditional",
  },
  {
    id: 10,
    name: "Treasure Hunt",
    concept: "Complex Conditionals",
    tutorial: "Navigate maze, collect treasures!",
    detailedInstructions: [
      "Combine everything you've learned",
      "Use loops for repeated moves",
      "Use IF ITEM_HERE to collect automatically",
      "Use IF WALL_AHEAD to avoid crashes",
      "🎉 NEW: BREAK stops a loop early when needed!",
    ],
    maxBlocks: 16,
    hasWalls: true,
    availableBlocks: [
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "COLLECT",
      "LOOP",
      "IF",
      "BREAK",
    ],
    collectibles: 4,
    requiredConcept: "conditional",
    customGoal: (playerPos, items, goalPos) => {
      return (
        items.every((item) => item.collected) &&
        playerPos.x === goalPos.x &&
        playerPos.y === goalPos.y
      );
    },
  },

  // SECTION 4: Functions (Levels 11-13)
  {
    id: 11,
    name: "Function Power",
    concept: "Reusable Code",
    tutorial: "Create a function to reuse complex patterns!",
    detailedInstructions: [
      "🎉 NEW BLOCK: FUNCTION",
      "Functions let you save and reuse sequences",
      "Example: Create 'StepRight' = RIGHT + IF ITEM_HERE { COLLECT }",
      "Then call StepRight multiple times",
      "Great for repeated complex patterns!",
    ],
    maxBlocks: 14,
    hasWalls: false,
    availableBlocks: [
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "COLLECT",
      "LOOP",
      "IF",
      "FUNCTION",
      "BREAK",
    ],
    collectibles: 3,
    requiredConcept: "function",
    customGoal: (playerPos, items, goalPos) => {
      return (
        items.every((item) => item.collected) &&
        playerPos.x === goalPos.x &&
        playerPos.y === goalPos.y
      );
    },
  },
  {
    id: 12,
    name: "Pattern Master",
    concept: "Function Optimization",
    tutorial: "Find the repeating pattern and functionize it!",
    detailedInstructions: [
      "Look for patterns in your required path",
      "Create a function for the pattern",
      "Use loops to call the function",
      "Achieve maximum code efficiency!",
    ],
    maxBlocks: 10,
    hasWalls: true,
    availableBlocks: [
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "LOOP",
      "IF",
      "FUNCTION",
      "BREAK",
    ],
    requiredConcept: "function",
  },

  // SECTION 5: Master Challenges (Levels 13-15)
  {
    id: 13,
    name: "The Gauntlet",
    concept: "Everything Combined",
    tutorial: "Use all your skills to master this complex maze!",
    detailedInstructions: [
      "This is a master challenge",
      "You'll need loops, conditionals, and functions",
      "Think about efficiency",
      "Multiple valid solutions exist!",
    ],
    maxBlocks: 20,
    hasWalls: true,
    availableBlocks: [
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "COLLECT",
      "LOOP",
      "IF",
      "FUNCTION",
      "WAIT",
      "BREAK",
    ],
    collectibles: 5,
    requiredConcept: "mixed",
    customGoal: (playerPos, items, goalPos) => {
      return (
        items.every((item) => item.collected) &&
        playerPos.x === goalPos.x &&
        playerPos.y === goalPos.y
      );
    },
  },
  {
    id: 14,
    name: "Efficiency Expert",
    concept: "Code Golf",
    tutorial: "Same as before, but use MINIMAL blocks!",
    detailedInstructions: [
      "You know the concepts...",
      "Now optimize your solution",
      "Use the fewest blocks possible",
      "Think like a real programmer!",
    ],
    maxBlocks: 12,
    hasWalls: true,
    availableBlocks: [
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "COLLECT",
      "LOOP",
      "IF",
      "FUNCTION",
      "BREAK",
    ],
    collectibles: 4,
    requiredConcept: "mixed",
    customGoal: (playerPos, items, goalPos) => {
      return (
        items.every((item) => item.collected) &&
        playerPos.x === goalPos.x &&
        playerPos.y === goalPos.y
      );
    },
  },
  {
    id: 15,
    name: "Final Boss",
    concept: "Ultimate Challenge",
    tutorial: "The ultimate programming puzzle!",
    detailedInstructions: [
      "🏆 FINAL CHALLENGE",
      "Complex maze with multiple paths",
      "Many collectibles and obstacles",
      "Show everything you've learned!",
      "Beat this to become a coding master!",
    ],
    maxBlocks: 25,
    hasWalls: true,
    availableBlocks: [
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "COLLECT",
      "LOOP",
      "IF",
      "FUNCTION",
      "WAIT",
      "BREAK",
    ],
    collectibles: 6,
    requiredConcept: "mixed",
    customGoal: (playerPos, items, goalPos) => {
      return (
        items.every((item) => item.collected) &&
        playerPos.x === goalPos.x &&
        playerPos.y === goalPos.y
      );
    },
  },
];

export default function CodingGame({ onBack }: { onBack: () => void }) {
  const { addXP, addCoins } = useUserStore();
  const { emotion, setEmotion, reactToSuccess } = useRukoEmotion("happy");

  const [levelIdx, setLevelIdx] = useState(0);
  const [program, setProgram] = useState<Block[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [executingBlockId, setExecutingBlockId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showBlockConfig, setShowBlockConfig] = useState<Block | null>(null);

  // Game state
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [initialPlayerPos, setInitialPlayerPos] = useState({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState({ x: 0, y: 0 });
  const [walls, setWalls] = useState<{ x: number; y: number }[]>([]);
  const [collectibles, setCollectibles] = useState<CollectibleItem[]>([]);
  const [initialCollectibles, setInitialCollectibles] = useState<
    CollectibleItem[]
  >([]);
  const [collectedCount, setCollectedCount] = useState(0);

  // Animation
  const rukoX = useSharedValue(0);
  const rukoY = useSharedValue(0);

  const currentLevel = LEVELS[levelIdx];

  // Generate level based on concept
  const generateLevel = () => {
    const level = currentLevel;
    let start: { x: number; y: number }, goal: { x: number; y: number };
    let newWalls: { x: number; y: number }[] = [];
    let newCollectibles: CollectibleItem[] = [];

    // Custom level generation based on concept
    if (level.id === 1) {
      // Simple straight line
      start = { x: 1, y: 2 };
      goal = { x: 3, y: 2 };
    } else if (level.id === 2) {
      // L-shape path
      start = { x: 1, y: 1 };
      goal = { x: 4, y: 3 };
    } else if (level.id === 3) {
      // Long winding path to show repetition
      start = { x: 0, y: 0 };
      goal = { x: 5, y: 5 };
      // Create a staircase pattern
      for (let i = 1; i < GRID_SIZE - 1; i++) {
        if (i % 2 === 0) {
          newWalls.push({ x: i, y: i - 1 });
        }
      }
    } else if (level.id === 4) {
      // Straight path perfect for loop introduction
      start = { x: 1, y: 3 };
      goal = { x: 5, y: 3 };
    } else if (level.id === 5) {
      // Path with multiple repeated segments
      start = { x: 0, y: 0 };
      goal = { x: 5, y: 2 };
    } else if (level.id === 6) {
      // Maze with walls
      start = { x: 0, y: 0 };
      goal = { x: 5, y: 5 };
      newWalls = [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 4, y: 3 },
        { x: 4, y: 4 },
        { x: 4, y: 5 },
      ];
    } else if (level.collectibles) {
      // Random with collectibles
      start = { x: 0, y: 0 };
      goal = { x: 5, y: 5 };

      // Add walls for complexity
      if (level.hasWalls) {
        const numWalls = Math.min(8, 3 + level.id);
        while (newWalls.length < numWalls) {
          const wall = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          };
          if (
            (wall.x !== start.x || wall.y !== start.y) &&
            (wall.x !== goal.x || wall.y !== goal.y) &&
            !newWalls.some((w) => w.x === wall.x && w.y === wall.y)
          ) {
            newWalls.push(wall);
          }
        }
      }

      // Add collectibles
      const itemTypes: Array<"coin" | "gem" | "key"> = ["coin", "gem", "key"];
      for (let i = 0; i < level.collectibles; i++) {
        let item: CollectibleItem;
        do {
          item = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
            type: itemTypes[i % itemTypes.length],
            collected: false,
          };
        } while (
          (item.x === start.x && item.y === start.y) ||
          (item.x === goal.x && item.y === goal.y) ||
          newWalls.some((w) => w.x === item.x && w.y === item.y) ||
          newCollectibles.some((c) => c.x === item.x && c.y === item.y)
        );
        newCollectibles.push(item);
      }
    } else {
      // Default random generation
      start = {
        x: Math.floor(Math.random() * (GRID_SIZE / 2)),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      do {
        goal = {
          x: Math.floor(GRID_SIZE / 2 + Math.random() * (GRID_SIZE / 2)),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (goal.x === start.x && goal.y === start.y);

      if (level.hasWalls) {
        const numWalls = 4 + Math.floor(Math.random() * 6);
        while (newWalls.length < numWalls) {
          const wall = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          };
          if (
            (wall.x !== start.x || wall.y !== start.y) &&
            (wall.x !== goal.x || wall.y !== goal.y) &&
            !newWalls.some((w) => w.x === wall.x && w.y === wall.y)
          ) {
            newWalls.push(wall);
          }
        }
      }
    }

    setPlayerPos(start);
    setInitialPlayerPos(start);
    setGoalPos(goal);
    setWalls(newWalls);
    setCollectibles(newCollectibles);
    setInitialCollectibles(JSON.parse(JSON.stringify(newCollectibles))); // Deep copy
    setCollectedCount(0);

    rukoX.value = withTiming(start.x * CELL_SIZE, { duration: 300 });
    rukoY.value = withTiming(start.y * CELL_SIZE, { duration: 300 });
  };

  useEffect(() => {
    resetLevel();
  }, [levelIdx]);

  const resetLevel = () => {
    setIsPlaying(false);
    setProgram([]);
    setExecutingBlockId(null);
    setShowSuccess(false);
    setShowInstructions(true);
    setEmotion("happy");
    generateLevel();
  };

  const resetToStartPosition = () => {
    setPlayerPos(initialPlayerPos);
    setCollectibles(JSON.parse(JSON.stringify(initialCollectibles)));
    setCollectedCount(0);
    rukoX.value = withTiming(initialPlayerPos.x * CELL_SIZE, { duration: 400 });
    rukoY.value = withTiming(initialPlayerPos.y * CELL_SIZE, { duration: 400 });
  };

  const generateBlockId = () => `block_${Date.now()}_${Math.random()}`;

  const addBlock = (type: BlockType) => {
    if (program.length >= currentLevel.maxBlocks) {
      Alert.alert(
        "Block Limit!",
        "You've reached the maximum blocks for this level.",
      );
      return;
    }

    const newBlock: Block = {
      id: generateBlockId(),
      type,
      children:
        type === "LOOP" || type === "IF" || type === "FUNCTION"
          ? []
          : undefined,
      value: type === "LOOP" ? 2 : undefined,
      condition: type === "IF" ? "ITEM_HERE" : undefined,
      functionName: type === "FUNCTION" ? "MyFunction" : undefined,
    };

    setProgram([...program, newBlock]);

    // Show config for complex blocks
    if (type === "LOOP" || type === "IF" || type === "FUNCTION") {
      setShowBlockConfig(newBlock);
    }
  };

  const removeBlock = (id: string) => {
    if (isPlaying) return;
    setProgram(program.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setProgram(program.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const addChildToBlock = (parentId: string, childType: BlockType) => {
    setProgram(
      program.map((block) => {
        if (block.id === parentId && block.children) {
          const newChild: Block = {
            id: generateBlockId(),
            type: childType,
            children:
              childType === "LOOP" ||
              childType === "IF" ||
              childType === "FUNCTION"
                ? []
                : undefined,
            value: childType === "LOOP" ? 2 : undefined,
            condition: childType === "IF" ? "ITEM_HERE" : undefined,
            parentId: parentId,
          };
          return { ...block, children: [...block.children, newChild] };
        }
        return block;
      }),
    );
  };

  const removeChildFromBlock = (parentId: string, childId: string) => {
    setProgram(
      program.map((block) => {
        if (block.id === parentId && block.children) {
          return {
            ...block,
            children: block.children.filter((c) => c.id !== childId),
          };
        }
        return block;
      }),
    );
  };

  const updateChildBlock = (
    parentId: string,
    childId: string,
    updates: Partial<Block>,
  ) => {
    setProgram(
      program.map((block) => {
        if (block.id === parentId && block.children) {
          return {
            ...block,
            children: block.children.map((child) =>
              child.id === childId ? { ...child, ...updates } : child,
            ),
          };
        }
        return block;
      }),
    );
  };

  const editBlock = (block: Block) => {
    setShowBlockConfig(block);
  };

  // Execute program
  const runProgram = async () => {
    if (program.length === 0) return;

    setIsPlaying(true);
    setExecutingBlockId(null);

    let x = playerPos.x;
    let y = playerPos.y;
    let currentCollectibles = [...collectibles];
    let shouldBreak = false;

    const executeBlock = async (
      block: Block,
      depth: number = 0,
    ): Promise<{
      x: number;
      y: number;
      items: CollectibleItem[];
      break: boolean;
    }> => {
      if (shouldBreak) return { x, y, items: currentCollectibles, break: true };

      setExecutingBlockId(block.id);
      await sleep(300);

      if (block.type === "BREAK") {
        shouldBreak = true;
        return { x, y, items: currentCollectibles, break: true };
      }

      if (block.type === "LOOP" && block.children) {
        const iterations = block.value || 1;
        for (let i = 0; i < iterations; i++) {
          if (shouldBreak) break;
          for (const child of block.children) {
            const result = await executeBlock(child, depth + 1);
            x = result.x;
            y = result.y;
            currentCollectibles = result.items;
            if (result.break) {
              shouldBreak = false; // Reset break after exiting loop
              break;
            }
          }
        }
      } else if (block.type === "IF" && block.children) {
        let conditionMet = false;

        if (block.condition === "ITEM_HERE") {
          conditionMet = currentCollectibles.some(
            (item) => item.x === x && item.y === y && !item.collected,
          );
        } else if (block.condition === "WALL_AHEAD") {
          // Check direction based on last move (simplified)
          conditionMet = walls.some((w) => w.x === x && w.y === y - 1); // Check up
        } else if (block.condition === "GOAL_AHEAD") {
          conditionMet = goalPos.x === x && goalPos.y === y - 1;
        }

        if (conditionMet) {
          for (const child of block.children) {
            if (shouldBreak) break;
            const result = await executeBlock(child, depth + 1);
            x = result.x;
            y = result.y;
            currentCollectibles = result.items;
            if (result.break) break;
          }
        }
      } else if (block.type === "FUNCTION" && block.children) {
        for (const child of block.children) {
          if (shouldBreak) break;
          const result = await executeBlock(child, depth + 1);
          x = result.x;
          y = result.y;
          currentCollectibles = result.items;
          if (result.break) break;
        }
      } else if (block.type === "COLLECT") {
        const item = currentCollectibles.find(
          (item) => item.x === x && item.y === y && !item.collected,
        );
        if (item) {
          item.collected = true;
          setCollectibles([...currentCollectibles]);
          setCollectedCount((prev) => prev + 1);
          setEmotion("celebrating");
          await sleep(300);
          setEmotion("happy");
        }
      } else if (block.type === "WAIT") {
        await sleep(500);
      } else {
        // Movement commands
        let newX = x,
          newY = y;

        if (block.type === "UP") newY--;
        if (block.type === "DOWN") newY++;
        if (block.type === "LEFT") newX--;
        if (block.type === "RIGHT") newX++;

        // Check bounds
        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
          setEmotion("sad");
          await sleep(300);
          setEmotion("happy");
          return { x, y, items: currentCollectibles, break: false };
        }

        // Check walls
        if (walls.some((w) => w.x === newX && w.y === newY)) {
          setEmotion("sad");
          await sleep(300);
          setEmotion("happy");
          return { x, y, items: currentCollectibles, break: false };
        }

        // Move with reduced bounce
        x = newX;
        y = newY;
        rukoX.value = withTiming(x * CELL_SIZE, { duration: 300 });
        rukoY.value = withTiming(y * CELL_SIZE, { duration: 300 });
        await sleep(400);
      }

      return { x, y, items: currentCollectibles, break: false };
    };

    // Execute all blocks
    for (const block of program) {
      if (shouldBreak) break;
      const result = await executeBlock(block);
      x = result.x;
      y = result.y;
      currentCollectibles = result.items;
    }

    // Check win condition
    const goalReached = currentLevel.customGoal
      ? currentLevel.customGoal({ x, y }, currentCollectibles, goalPos)
      : x === goalPos.x && y === goalPos.y;

    if (goalReached) {
      reactToSuccess();
      setEmotion("celebrating");
      const xpReward = 50 + levelIdx * 10;
      const coinReward = 20 + levelIdx * 5;
      addXP(xpReward);
      addCoins(coinReward);
      setTimeout(() => setShowSuccess(true), 500);
    } else {
      setEmotion("confused" as any);

      if (
        currentLevel.collectibles &&
        !currentCollectibles.every((item) => item.collected)
      ) {
        Alert.alert(
          "Missing Items!",
          `You need to collect all ${currentLevel.collectibles} items before reaching the goal!`,
        );
      } else {
        Alert.alert(
          "Not quite!",
          `You ended at (${x},${y}), but the goal is at (${goalPos.x},${goalPos.y})`,
        );
      }

      // Reset to starting position after failed run
      setTimeout(() => {
        resetToStartPosition();
        setEmotion("happy");
      }, 1000);
    }

    setIsPlaying(false);
    setExecutingBlockId(null);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const getHint = () => {
    if (currentLevel.hints && currentLevel.hints.length > 0) {
      const hint =
        currentLevel.hints[
          Math.floor(Math.random() * currentLevel.hints.length)
        ];
      Alert.alert("💡 Hint", hint);
    } else {
      Alert.alert(
        "💡 Hint",
        "Think about the most efficient path. Use loops for repeated moves!",
      );
    }
  };

  const nextLevel = () => {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx((p) => p + 1);
      setShowSuccess(false);
    } else {
      Alert.alert(
        "🎉 CONGRATULATIONS!",
        "You've mastered all levels! You're now a coding expert!",
        [{ text: "Awesome!", onPress: onBack }],
      );
    }
  };

  const rukoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rukoX.value }, { translateY: rukoY.value }],
  }));

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isWall = walls.some((w) => w.x === x && w.y === y);
        const isGoal = goalPos.x === x && goalPos.y === y;
        const isStart = playerPos.x === x && playerPos.y === y;
        const collectible = collectibles.find(
          (c) => c.x === x && c.y === y && !c.collected,
        );

        cells.push(
          <View
            key={`${x}-${y}`}
            style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
          >
            {isWall && <View style={styles.wall} />}
            {isGoal && <Text style={{ fontSize: CELL_SIZE * 0.5 }}>🔋</Text>}
            {collectible && (
              <Text style={{ fontSize: CELL_SIZE * 0.4 }}>
                {collectible.type === "coin"
                  ? "🪙"
                  : collectible.type === "gem"
                    ? "💎"
                    : "🔑"}
              </Text>
            )}
            {isStart && !isGoal && !collectible && (
              <View style={styles.startDot} />
            )}
          </View>,
        );
      }
    }
    return cells;
  };

  const renderBlock = (block: Block, depth: number = 0, parentId?: string) => {
    const isExecuting = executingBlockId === block.id;
    const isContainer =
      block.type === "LOOP" || block.type === "IF" || block.type === "FUNCTION";

    return (
      <View key={block.id} style={{ marginLeft: depth * 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <TouchableOpacity
            onPress={() => (isContainer ? editBlock(block) : null)}
            onLongPress={() =>
              parentId
                ? removeChildFromBlock(parentId, block.id)
                : removeBlock(block.id)
            }
            style={[
              styles.block,
              isContainer && styles.containerBlock,
              isExecuting && styles.executingBlock,
              { backgroundColor: getBlockColor(block.type), flex: 1 },
            ]}
          >
            <Text style={styles.blockText}>
              {getBlockIcon(block.type)} {getBlockLabel(block)}
            </Text>
          </TouchableOpacity>

          {/* Edit button for container blocks */}
          {isContainer && (
            <TouchableOpacity
              onPress={() => editBlock(block)}
              style={[styles.iconBtn, { backgroundColor: "#3b82f6" }]}
            >
              <Text style={{ color: "white", fontSize: 12 }}>✏️</Text>
            </TouchableOpacity>
          )}

          {/* Delete button */}
          <TouchableOpacity
            onPress={() =>
              parentId
                ? removeChildFromBlock(parentId, block.id)
                : removeBlock(block.id)
            }
            style={[styles.iconBtn, { backgroundColor: "#ef4444" }]}
          >
            <Text style={{ color: "white", fontSize: 12 }}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {isContainer && block.children && block.children.length > 0 && (
          <View style={styles.childrenContainer}>
            {block.children.map((child) =>
              renderBlock(child, depth + 1, block.id),
            )}
          </View>
        )}
      </View>
    );
  };

  const getBlockColor = (type: BlockType): string => {
    const colors: Record<BlockType, string> = {
      UP: "#3b82f6",
      DOWN: "#3b82f6",
      LEFT: "#3b82f6",
      RIGHT: "#3b82f6",
      COLLECT: "#f59e0b",
      LOOP: "#8b5cf6",
      IF: "#ec4899",
      FUNCTION: "#10b981",
      WAIT: "#6b7280",
      BREAK: "#dc2626",
    };
    return colors[type] || "#64748b";
  };

  const getBlockIcon = (type: BlockType): string => {
    const icons: Record<BlockType, string> = {
      UP: "⬆️",
      DOWN: "⬇️",
      LEFT: "⬅️",
      RIGHT: "➡️",
      COLLECT: "🤲",
      LOOP: "🔄",
      IF: "❓",
      FUNCTION: "⚡",
      WAIT: "⏸️",
      BREAK: "🛑",
    };
    return icons[type] || "?";
  };

  const getBlockLabel = (block: Block): string => {
    if (block.type === "LOOP") return `Repeat ${block.value || 2}×`;
    if (block.type === "IF") return `IF ${block.condition || "?"}`;
    if (block.type === "FUNCTION") return block.functionName || "Function";
    return block.type;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 24 }}>⬅️</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Level {levelIdx + 1}: {currentLevel.name}
          </Text>
          <Text style={{ fontSize: 12, color: "#64748b" }}>
            {currentLevel.concept}
          </Text>
          {currentLevel.collectibles && (
            <Text style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>
              Items: {collectedCount}/{currentLevel.collectibles}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={resetLevel}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <ScrollView style={{ flex: 1 }}>
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <View
            style={[
              styles.grid,
              { width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE },
            ]}
          >
            {renderGrid()}
            <Animated.View
              style={[
                styles.ruko,
                { width: CELL_SIZE, height: CELL_SIZE },
                rukoStyle,
              ]}
            >
              <LivingRuko emotion={emotion} size={CELL_SIZE * 0.7} />
            </Animated.View>
          </View>
        </View>

        {/* Program Area */}
        <View style={styles.codeArea}>
          <View style={styles.codeHeader}>
            <Text style={{ fontWeight: "bold" }}>
              Your Program ({program.length}/{currentLevel.maxBlocks})
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={getHint}
                style={[styles.btn, { backgroundColor: "#3b82f6" }]}
              >
                <Text style={{ color: "white", fontSize: 12 }}>💡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setProgram([])}
                style={[styles.btn, { backgroundColor: "#ef4444" }]}
              >
                <Text style={{ color: "white", fontSize: 12 }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={runProgram}
                disabled={isPlaying || program.length === 0}
                style={[
                  styles.btn,
                  {
                    backgroundColor:
                      program.length === 0 ? "#94a3b8" : "#22c55e",
                  },
                ]}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  ▶️ Run
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 200, marginTop: 10 }}>
            {program.length === 0 ? (
              <Text
                style={{ color: "#94a3b8", textAlign: "center", marginTop: 20 }}
              >
                Tap blocks below to start coding...
              </Text>
            ) : (
              program.map((block) => renderBlock(block))
            )}
          </ScrollView>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Text
            style={{
              marginBottom: 10,
              color: "#475569",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {currentLevel.tutorial}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View
              style={{ flexDirection: "row", gap: 8, paddingHorizontal: 10 }}
            >
              {currentLevel.availableBlocks.map((blockType) => (
                <TouchableOpacity
                  key={blockType}
                  onPress={() => addBlock(blockType)}
                  disabled={
                    isPlaying || program.length >= currentLevel.maxBlocks
                  }
                  style={[
                    styles.controlBtn,
                    {
                      backgroundColor: getBlockColor(blockType),
                      opacity:
                        isPlaying || program.length >= currentLevel.maxBlocks
                          ? 0.3
                          : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>
                    {getBlockIcon(blockType)}
                  </Text>
                  <Text style={{ fontSize: 10, color: "white", marginTop: 2 }}>
                    {blockType === "LOOP"
                      ? "Loop"
                      : blockType === "IF"
                        ? "If"
                        : blockType === "FUNCTION"
                          ? "Func"
                          : blockType === "COLLECT"
                            ? "Get"
                            : blockType === "WAIT"
                              ? "Wait"
                              : blockType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Instructions Modal */}
      <Modal visible={showInstructions} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.instructionsModal}>
            <Text style={styles.instructionsTitle}>
              📚 Level {levelIdx + 1}: {currentLevel.name}
            </Text>
            <Text style={styles.instructionsConcept}>
              Concept: {currentLevel.concept}
            </Text>
            <View style={styles.instructionsList}>
              {currentLevel.detailedInstructions.map((instruction, i) => (
                <Text key={i} style={styles.instructionItem}>
                  {instruction.startsWith("🎉") ||
                  instruction.startsWith("⚠️") ||
                  instruction.startsWith("🪙") ||
                  instruction.startsWith("🏆")
                    ? ""
                    : "• "}
                  {instruction}
                </Text>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowInstructions(false)}
              style={[
                styles.btn,
                {
                  backgroundColor: "#22c55e",
                  paddingHorizontal: 30,
                  paddingVertical: 12,
                },
              ]}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                Let's Go! 🚀
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Block Configuration Modal */}
      <Modal
        visible={showBlockConfig !== null}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.configModal}>
            {showBlockConfig?.type === "LOOP" && (
              <>
                <Text style={styles.configTitle}>Configure Loop</Text>
                <Text style={{ marginBottom: 10 }}>
                  How many times to repeat?
                </Text>
                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}
                >
                  {[2, 3, 4, 5, 6].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => {
                        if (showBlockConfig) {
                          updateBlock(showBlockConfig.id, { value: num });
                        }
                      }}
                      style={[
                        styles.numberBtn,
                        showBlockConfig?.value === num && {
                          backgroundColor: "#8b5cf6",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            showBlockConfig?.value === num
                              ? "white"
                              : "#1e293b",
                          fontWeight: "bold",
                        }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ marginBottom: 10, fontWeight: "600" }}>
                  Add commands to loop:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 15 }}
                >
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(
                      [
                        "UP",
                        "DOWN",
                        "LEFT",
                        "RIGHT",
                        "COLLECT",
                        "IF",
                        "BREAK",
                      ] as BlockType[]
                    ).map((cmd) => (
                      <TouchableOpacity
                        key={cmd}
                        onPress={() => {
                          if (showBlockConfig) {
                            addChildToBlock(showBlockConfig.id, cmd);
                          }
                        }}
                        style={[
                          styles.smallBtn,
                          { backgroundColor: getBlockColor(cmd) },
                        ]}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {getBlockIcon(cmd)}
                        </Text>
                        <Text
                          style={{ fontSize: 8, color: "white", marginTop: 2 }}
                        >
                          {cmd === "IF" ? "If" : cmd === "BREAK" ? "Brk" : ""}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {showBlockConfig?.type === "IF" && (
              <>
                <Text style={styles.configTitle}>Configure IF Block</Text>
                <Text style={{ marginBottom: 10 }}>
                  What condition to check?
                </Text>
                <View style={{ gap: 10, marginBottom: 20 }}>
                  {(["ITEM_HERE", "WALL_AHEAD", "GOAL_AHEAD"] as const).map(
                    (cond) => (
                      <TouchableOpacity
                        key={cond}
                        onPress={() => {
                          if (showBlockConfig) {
                            updateBlock(showBlockConfig.id, {
                              condition: cond,
                            });
                          }
                        }}
                        style={[
                          styles.conditionBtn,
                          showBlockConfig?.condition === cond && {
                            backgroundColor: "#ec4899",
                            borderColor: "#ec4899",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              showBlockConfig?.condition === cond
                                ? "white"
                                : "#1e293b",
                            fontWeight: "600",
                          }}
                        >
                          {cond === "ITEM_HERE"
                            ? "📦 Item is here"
                            : cond === "WALL_AHEAD"
                              ? "🧱 Wall ahead"
                              : "🎯 Goal ahead"}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
                <Text style={{ marginBottom: 10, fontWeight: "600" }}>
                  Then do:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 15 }}
                >
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(
                      [
                        "UP",
                        "DOWN",
                        "LEFT",
                        "RIGHT",
                        "COLLECT",
                        "BREAK",
                      ] as BlockType[]
                    ).map((cmd) => (
                      <TouchableOpacity
                        key={cmd}
                        onPress={() => {
                          if (showBlockConfig) {
                            addChildToBlock(showBlockConfig.id, cmd);
                          }
                        }}
                        style={[
                          styles.smallBtn,
                          { backgroundColor: getBlockColor(cmd) },
                        ]}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {getBlockIcon(cmd)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {showBlockConfig?.type === "FUNCTION" && (
              <>
                <Text style={styles.configTitle}>Configure Function</Text>
                <Text style={{ marginBottom: 10 }}>
                  Add commands to function:
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginBottom: 15,
                    flexWrap: "wrap",
                  }}
                >
                  {(
                    ["UP", "DOWN", "LEFT", "RIGHT", "COLLECT"] as CommandType[]
                  ).map((cmd) => (
                    <TouchableOpacity
                      key={cmd}
                      onPress={() => {
                        if (showBlockConfig) {
                          addChildToBlock(showBlockConfig.id, cmd);
                        }
                      }}
                      style={[
                        styles.smallBtn,
                        { backgroundColor: getBlockColor(cmd) },
                      ]}
                    >
                      <Text style={{ fontSize: 16 }}>{getBlockIcon(cmd)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {showBlockConfig &&
              showBlockConfig.children &&
              showBlockConfig.children.length > 0 && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                    Current commands:
                  </Text>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {showBlockConfig.children.map((child) => (
                      <View
                        key={child.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          marginBottom: 5,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            if (child.type === "IF" || child.type === "LOOP") {
                              // Allow editing nested blocks
                              const nestedBlock =
                                showBlockConfig.children?.find(
                                  (c) => c.id === child.id,
                                );
                              if (nestedBlock) {
                                setShowBlockConfig(nestedBlock);
                              }
                            }
                          }}
                          style={[
                            styles.miniBlock,
                            {
                              backgroundColor: getBlockColor(child.type),
                              flex: 1,
                            },
                          ]}
                        >
                          <Text style={{ color: "white", fontSize: 12 }}>
                            {getBlockIcon(child.type)} {getBlockLabel(child)}
                          </Text>
                        </TouchableOpacity>
                        {(child.type === "IF" || child.type === "LOOP") && (
                          <TouchableOpacity
                            onPress={() => {
                              const nestedBlock =
                                showBlockConfig.children?.find(
                                  (c) => c.id === child.id,
                                );
                              if (nestedBlock) {
                                setShowBlockConfig(nestedBlock);
                              }
                            }}
                            style={[
                              styles.iconBtn,
                              { backgroundColor: "#3b82f6" },
                            ]}
                          >
                            <Text style={{ fontSize: 10 }}>✏️</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() =>
                            removeChildFromBlock(showBlockConfig.id, child.id)
                          }
                          style={[
                            styles.iconBtn,
                            { backgroundColor: "#ef4444" },
                          ]}
                        >
                          <Text style={{ fontSize: 10 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

            <TouchableOpacity
              onPress={() => setShowBlockConfig(null)}
              style={[
                styles.btn,
                {
                  backgroundColor: "#22c55e",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                },
              ]}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Done ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      {showSuccess && (
        <Animated.View entering={FadeInDown} style={styles.successModal}>
          <Text style={{ fontSize: 50 }}>🎉</Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#16a34a",
              marginTop: 10,
            }}
          >
            Level Complete!
          </Text>
          <Text style={{ color: "#64748b", marginTop: 5 }}>
            +{50 + levelIdx * 10} XP • +{20 + levelIdx * 5} Coins
          </Text>
          {levelIdx === 2 && (
            <Text
              style={{
                marginTop: 15,
                fontSize: 16,
                color: "#8b5cf6",
                fontWeight: "600",
              }}
            >
              🔄 Loop Block Unlocked!
            </Text>
          )}
          {levelIdx === 7 && (
            <Text
              style={{
                marginTop: 15,
                fontSize: 16,
                color: "#ec4899",
                fontWeight: "600",
              }}
            >
              ❓ IF Block Unlocked!
            </Text>
          )}
          {levelIdx === 10 && (
            <Text
              style={{
                marginTop: 15,
                fontSize: 16,
                color: "#10b981",
                fontWeight: "600",
              }}
            >
              ⚡ Function Block Unlocked!
            </Text>
          )}
          <TouchableOpacity
            onPress={nextLevel}
            style={[
              styles.btn,
              {
                marginTop: 20,
                paddingHorizontal: 30,
                paddingVertical: 12,
                backgroundColor: "#22c55e",
              },
            ]}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              {levelIdx < LEVELS.length - 1 ? "Next Level ➡️" : "Finish! 🏆"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cell: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  wall: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 2,
  },
  startDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  ruko: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  codeArea: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 10,
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  block: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  containerBlock: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  executingBlock: {
    borderWidth: 3,
    borderColor: "#fbbf24",
    transform: [{ scale: 1.05 }],
  },
  blockText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  childrenContainer: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: "#cbd5e1",
    paddingLeft: 10,
  },
  controls: {
    padding: 20,
    backgroundColor: "#f1f5f9",
  },
  controlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 60,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionsModal: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 20,
    width: "85%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1e293b",
  },
  instructionsConcept: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 15,
    fontWeight: "600",
  },
  instructionsList: {
    marginBottom: 20,
  },
  instructionItem: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
    lineHeight: 20,
  },
  configModal: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 20,
    width: "85%",
    maxWidth: 400,
    elevation: 10,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#1e293b",
  },
  numberBtn: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },
  conditionBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  smallBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  miniBlock: {
    padding: 8,
    borderRadius: 6,
    minWidth: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  successModal: {
    position: "absolute",
    top: "25%",
    left: "10%",
    right: "10%",
    backgroundColor: "white",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
