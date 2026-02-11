// src/features/coding-class/CodingGame.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import LivingRuko from "../../components/ruko/LivingRuko";
import { useUserStore } from "../../store/userStore";
import { useRukoEmotion } from "../../hooks/useRukoEmotion";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = 5;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / GRID_SIZE);

// --- Types ---
type CommandType = "UP" | "DOWN" | "LEFT" | "RIGHT";
type BlockType = { id: string; type: CommandType };
type CellType = "EMPTY" | "WALL" | "START" | "GOAL" | "HAZARD" | "COIN";

interface LevelData {
  id: number;
  name: string;
  grid: CellType[][];
  startPos: { x: number; y: number };
  maxBlocks: number;
  tutorial: string;
  hint?: string;
  coins?: { x: number; y: number }[];
}

// --- Enhanced Levels ---
const LEVELS: LevelData[] = [
  {
    id: 1,
    name: "First Steps",
    startPos: { x: 0, y: 2 },
    maxBlocks: 3,
    tutorial: "Help me reach the battery! Use arrows to move right!",
    hint: "Try: Right, Right, Right",
    grid: [
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
      ["START", "EMPTY", "EMPTY", "GOAL", "EMPTY"],
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
    ],
  },
  {
    id: 2,
    name: "Around the Wall",
    startPos: { x: 0, y: 0 },
    maxBlocks: 6,
    tutorial: "There's a wall blocking our way! We need to go around it.",
    hint: "Go down first, then right, then up!",
    grid: [
      ["START", "WALL", "EMPTY", "EMPTY", "EMPTY"],
      ["EMPTY", "WALL", "EMPTY", "EMPTY", "EMPTY"],
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
      ["EMPTY", "EMPTY", "GOAL", "EMPTY", "EMPTY"],
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
    ],
  },
  {
    id: 3,
    name: "The Snake",
    startPos: { x: 0, y: 4 },
    maxBlocks: 8,
    tutorial: "Follow the path like a snake! Don't hit the walls!",
    hint: "Right, Up, Right, Up, Right, Up...",
    grid: [
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "GOAL"],
      ["WALL", "WALL", "WALL", "WALL", "EMPTY"],
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
      ["EMPTY", "WALL", "WALL", "WALL", "WALL"],
      ["START", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
    ],
  },
  {
    id: 4,
    name: "Coin Collector",
    startPos: { x: 0, y: 0 },
    maxBlocks: 10,
    tutorial: "Collect all coins before reaching the battery! Can you do it?",
    hint: "Plan your route to grab every coin!",
    coins: [
      { x: 2, y: 0 },
      { x: 4, y: 2 },
      { x: 2, y: 4 },
    ],
    grid: [
      ["START", "EMPTY", "COIN", "EMPTY", "EMPTY"],
      ["EMPTY", "WALL", "EMPTY", "WALL", "EMPTY"],
      ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "COIN"],
      ["EMPTY", "WALL", "EMPTY", "WALL", "EMPTY"],
      ["EMPTY", "EMPTY", "COIN", "EMPTY", "GOAL"],
    ],
  },
  {
    id: 5,
    name: "The Maze",
    startPos: { x: 0, y: 2 },
    maxBlocks: 12,
    tutorial: "This is tricky! Watch out for dead ends!",
    hint: "Sometimes you need to go backwards to go forwards!",
    grid: [
      ["EMPTY", "WALL", "GOAL", "WALL", "EMPTY"],
      ["EMPTY", "WALL", "EMPTY", "WALL", "EMPTY"],
      ["START", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
      ["EMPTY", "WALL", "EMPTY", "WALL", "EMPTY"],
      ["EMPTY", "WALL", "EMPTY", "WALL", "EMPTY"],
    ],
  },
];

// --- Components ---

const BlockBtn = ({
  type,
  onPress,
  disabled,
}: {
  type: CommandType;
  onPress: () => void;
  disabled: boolean;
}) => {
  const icons = {
    UP: "⬆️",
    DOWN: "⬇️",
    LEFT: "⬅️",
    RIGHT: "➡️",
  };

  const labels = {
    UP: "Up",
    DOWN: "Down",
    LEFT: "Left",
    RIGHT: "Right",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.blockBtn, disabled && styles.blockBtnDisabled]}
    >
      <Text style={styles.blockBtnIcon}>{icons[type]}</Text>
      <Text style={styles.blockBtnLabel}>{labels[type]}</Text>
    </TouchableOpacity>
  );
};

export default function CodingGame({ onBack }: { onBack: () => void }) {
  const { addXP, addCoins, level: userLevel } = useUserStore();
  const { emotion, setEmotion, reactToSuccess, reactToFailure } =
    useRukoEmotion("happy");

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [program, setProgram] = useState<BlockType[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [collectedCoins, setCollectedCoins] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [executionStep, setExecutionStep] = useState(-1);

  // Use ref to track position during animation to avoid stale closures
  const positionRef = useRef({ x: 0, y: 0 });

  // Animation Values
  const rukoX = useSharedValue(0);
  const rukoY = useSharedValue(0);
  const rukoRotate = useSharedValue(0);
  const rukoScale = useSharedValue(1);

  const currentLevel = LEVELS[currentLevelIdx];

  // Initialize Ruko Position on Level Change
  useEffect(() => {
    resetLevel();
  }, [currentLevelIdx]);

  const resetLevel = useCallback(() => {
    setIsPlaying(false);
    setProgram([]);
    setShowSuccess(false);
    setCollectedCoins([]);
    setShowHint(false);
    setExecutionStep(-1);
    setEmotion("happy");

    const startX = currentLevel.startPos.x * CELL_SIZE;
    const startY = currentLevel.startPos.y * CELL_SIZE;

    positionRef.current = {
      x: currentLevel.startPos.x,
      y: currentLevel.startPos.y,
    };

    rukoX.value = withSpring(startX);
    rukoY.value = withSpring(startY);
    rukoRotate.value = withSpring(0);
    rukoScale.value = withSpring(1);
  }, [currentLevel]);

  const addBlock = useCallback(
    (type: CommandType) => {
      if (isPlaying) return;
      if (program.length >= currentLevel.maxBlocks) {
        setEmotion("confused" as any); // Cast to any to bypass strict check if type isn't updated
        Alert.alert(
          "Memory Full!",
          `You can only use ${currentLevel.maxBlocks} blocks. Remove some to add more!`,
        );
        return;
      }
      setProgram((prev) => [
        ...prev,
        { id: Date.now().toString() + Math.random(), type },
      ]);
      setEmotion("happy");
    },
    [isPlaying, program.length, currentLevel.maxBlocks],
  );

  const removeBlock = useCallback(
    (index: number) => {
      if (isPlaying) return;
      setProgram((prev) => {
        const newProg = [...prev];
        newProg.splice(index, 1);
        return newProg;
      });
    },
    [isPlaying],
  );

  const clearProgram = useCallback(() => {
    if (isPlaying) return;
    setProgram([]);
  }, [isPlaying]);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const runProgram = useCallback(async () => {
    if (program.length === 0) {
      setEmotion("curious");
      Alert.alert("Empty Program", "Add some movement blocks first!");
      return;
    }

    setIsPlaying(true);
    setEmotion("thinking");
    setExecutionStep(0);

    // Reset to start
    let currentX = currentLevel.startPos.x;
    let currentY = currentLevel.startPos.y;
    positionRef.current = { x: currentX, y: currentY };

    rukoX.value = withTiming(currentX * CELL_SIZE, { duration: 300 });
    rukoY.value = withTiming(currentY * CELL_SIZE, { duration: 300 });

    await sleep(400);

    for (let i = 0; i < program.length; i++) {
      setExecutionStep(i);
      const command = program[i];

      // Calculate rotation based on direction
      let targetRotate = 0;
      if (command.type === "UP") targetRotate = -90;
      if (command.type === "DOWN") targetRotate = 90;
      if (command.type === "LEFT") targetRotate = 180;
      if (command.type === "RIGHT") targetRotate = 0;

      rukoRotate.value = withTiming(targetRotate, { duration: 200 });

      // Calculate next position
      let nextX = currentX;
      let nextY = currentY;

      if (command.type === "UP") nextY -= 1;
      if (command.type === "DOWN") nextY += 1;
      if (command.type === "LEFT") nextX -= 1;
      if (command.type === "RIGHT") nextX += 1;

      // Check Bounds
      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
        rukoX.value = withSequence(
          withTiming(currentX * CELL_SIZE + (nextX - currentX) * 20, {
            duration: 200,
          }),
          withTiming(currentX * CELL_SIZE, { duration: 200 }),
        );
        handleCrash("Oops! I hit the wall! Can't go outside the grid!");
        return;
      }

      // Check Walls
      if (currentLevel.grid[nextY][nextX] === "WALL") {
        rukoX.value = withSequence(
          withTiming(nextX * CELL_SIZE, { duration: 150 }),
          withTiming(currentX * CELL_SIZE, { duration: 150 }),
        );
        rukoY.value = withSequence(
          withTiming(nextY * CELL_SIZE, { duration: 150 }),
          withTiming(currentY * CELL_SIZE, { duration: 150 }),
        );
        handleCrash("Bonk! That's a wall! I can't walk through it!");
        return;
      }

      // Valid Move - Update position
      currentX = nextX;
      currentY = nextY;
      positionRef.current = { x: currentX, y: currentY };

      // Animate movement
      rukoX.value = withTiming(currentX * CELL_SIZE, {
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
      });
      rukoY.value = withTiming(currentY * CELL_SIZE, {
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
      });

      // Check for coins
      if (currentLevel.coins) {
        const coinIndex = currentLevel.coins.findIndex(
          (c) => c.x === currentX && c.y === currentY,
        );
        if (coinIndex !== -1 && !collectedCoins.includes(coinIndex)) {
          setCollectedCoins((prev) => [...prev, coinIndex]);
          setEmotion("excited");
          await sleep(200);
          setEmotion("thinking");
        }
      }

      await sleep(450);
    }

    setExecutionStep(-1);

    // Check Goal
    if (currentLevel.grid[currentY][currentX] === "GOAL") {
      if (
        currentLevel.coins &&
        collectedCoins.length < currentLevel.coins.length
      ) {
        handleCrash("You missed some coins! Collect them all first!");
        return;
      }
      handleSuccess();
    } else {
      setEmotion("confused" as any);
      setIsPlaying(false);
      Alert.alert(
        "Not quite!",
        "I need to reach the battery (🔋)! Try a different path.",
      );
    }
  }, [program, currentLevel, collectedCoins]);

  const handleCrash = useCallback(
    (message: string) => {
      setEmotion("sad");
      reactToFailure();
      rukoScale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 }),
      );
      setIsPlaying(false);
      setExecutionStep(-1);

      // Use setTimeout to avoid Alert during render
      setTimeout(() => {
        Alert.alert("Crash!", message);
      }, 100);
    },
    [reactToFailure],
  );

  const handleSuccess = useCallback(() => {
    setEmotion("excited");
    reactToSuccess();

    const coinBonus = collectedCoins.length * 5;
    const blockBonus = Math.max(
      0,
      (currentLevel.maxBlocks - program.length) * 2,
    );
    const totalXP = 50 + coinBonus + blockBonus;
    const totalCoins = 10 + coinBonus;

    addXP(totalXP);
    addCoins(totalCoins);

    setTimeout(() => {
      setShowSuccess(true);
    }, 300);
  }, [
    collectedCoins.length,
    currentLevel.maxBlocks,
    program.length,
    reactToSuccess,
    addXP,
    addCoins,
  ]);

  const nextLevel = useCallback(() => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
    } else {
      Alert.alert(
        "🎉 Coding Master!",
        "You've completed all levels! More coming soon!",
        [{ text: "Awesome!", onPress: onBack }],
      );
    }
  }, [currentLevelIdx, onBack]);

  // --- Render Helpers ---

  const rukoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rukoX.value },
      { translateY: rukoY.value },
      { rotate: `${rukoRotate.value}deg` },
      { scale: rukoScale.value },
    ],
  }));

  const renderGrid = useCallback(() => {
    return currentLevel.grid.map((row, y) =>
      row.map((cell, x) => {
        let content = null;
        let cellStyle = styles.cellEmpty;

        if (cell === "WALL") {
          content = <View style={styles.wall} />;
        } else if (cell === "GOAL") {
          content = <Text style={styles.goalEmoji}>🔋</Text>;
        } else if (cell === "START") {
          content = <Text style={styles.startEmoji}>🚀</Text>;
        }

        // Check for coins at this position
        const coinIndex = currentLevel.coins?.findIndex(
          (c) => c.x === x && c.y === y,
        );
        const hasCoin = coinIndex !== undefined && coinIndex !== -1;
        const isCollected = hasCoin && collectedCoins.includes(coinIndex);

        return (
          <View
            key={`${x}-${y}`}
            style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
          >
            {content}
            {hasCoin && !isCollected && (
              <Text style={styles.coinEmoji}>🪙</Text>
            )}
            {hasCoin && isCollected && (
              <Text style={styles.collectedCoinEmoji}>✨</Text>
            )}
          </View>
        );
      }),
    );
  }, [currentLevel, collectedCoins]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>🔙</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Level {currentLevelIdx + 1}</Text>
          <Text style={styles.headerSubtitle}>{currentLevel.name}</Text>
        </View>
        <TouchableOpacity onPress={resetLevel} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tutorial Message */}
        <View style={styles.tutorialCard}>
          <LivingRuko emotion={emotion} size={50} />
          <Text style={styles.tutorialText}>
            {showSuccess
              ? "We did it! Amazing coding! 🎉"
              : currentLevel.tutorial}
          </Text>
        </View>

        {/* Hint Button */}
        {!showSuccess && currentLevel.hint && (
          <TouchableOpacity
            onPress={() => setShowHint(!showHint)}
            style={styles.hintBtn}
          >
            <Text style={styles.hintBtnText}>
              {showHint ? "💡 Hide Hint" : "💡 Show Hint"}
            </Text>
          </TouchableOpacity>
        )}

        {showHint && currentLevel.hint && (
          <Animated.View entering={FadeIn} style={styles.hintCard}>
            <Text style={styles.hintText}>{currentLevel.hint}</Text>
          </Animated.View>
        )}

        {/* Game Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {renderGrid()}

            {/* Ruko Character */}
            <Animated.View style={[styles.rukoContainer, rukoAnimatedStyle]}>
              <LivingRuko emotion={emotion} size={CELL_SIZE * 0.75} />
            </Animated.View>
          </View>
        </View>

        {/* Progress Indicator */}
        {isPlaying && executionStep >= 0 && (
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              Step {executionStep + 1} of {program.length}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((executionStep + 1) / program.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Coding Area (Workspace) */}
        <View style={styles.workspace}>
          <View style={styles.workspaceHeader}>
            <Text style={styles.workspaceTitle}>Your Program:</Text>
            <View style={styles.workspaceActions}>
              <Text style={styles.blockCount}>
                {program.length} / {currentLevel.maxBlocks}
              </Text>
              {program.length > 0 && (
                <TouchableOpacity
                  onPress={clearProgram}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.programArea}>
            {program.length === 0 ? (
              <Text style={styles.emptyText}>
                Tap arrows below to add commands
              </Text>
            ) : (
              program.map((block, index) => (
                <TouchableOpacity
                  key={block.id}
                  onPress={() => removeBlock(index)}
                  disabled={isPlaying}
                  style={[
                    styles.programBlock,
                    block.type === "UP" || block.type === "DOWN"
                      ? styles.programBlockVertical
                      : styles.programBlockHorizontal,
                    executionStep === index && styles.programBlockActive,
                    executionStep > index && styles.programBlockExecuted,
                  ]}
                >
                  <Text style={styles.programBlockIcon}>
                    {block.type === "UP"
                      ? "⬆️"
                      : block.type === "DOWN"
                        ? "⬇️"
                        : block.type === "LEFT"
                          ? "⬅️"
                          : "➡️"}
                  </Text>
                  <Text style={styles.programBlockNumber}>{index + 1}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Controls (Toolbox) */}
        <View style={styles.toolbox}>
          <Text style={styles.toolboxTitle}>Command Blocks:</Text>

          <View style={styles.controlsRow}>
            <BlockBtn
              type="UP"
              onPress={() => addBlock("UP")}
              disabled={isPlaying}
            />
            <BlockBtn
              type="LEFT"
              onPress={() => addBlock("LEFT")}
              disabled={isPlaying}
            />
            <BlockBtn
              type="RIGHT"
              onPress={() => addBlock("RIGHT")}
              disabled={isPlaying}
            />
            <BlockBtn
              type="DOWN"
              onPress={() => addBlock("DOWN")}
              disabled={isPlaying}
            />
          </View>

          {/* Run Button */}
          <TouchableOpacity
            onPress={runProgram}
            disabled={isPlaying || program.length === 0}
            style={[
              styles.runBtn,
              (isPlaying || program.length === 0) && styles.runBtnDisabled,
            ]}
          >
            <Text style={styles.runBtnIcon}>{isPlaying ? "⏳" : "▶️"}</Text>
            <Text style={styles.runBtnText}>
              {isPlaying ? "Running..." : "RUN CODE"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      {showSuccess && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Level Complete!</Text>
            <Text style={styles.modalMessage}>
              You successfully programmed Ruko!
            </Text>

            {collectedCoins.length > 0 && (
              <Text style={styles.modalBonus}>
                🪙 Coin Bonus: {collectedCoins.length * 5} XP!
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={onBack}
                style={styles.modalBtnSecondary}
              >
                <Text style={styles.modalBtnSecondaryText}>Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextLevel}
                style={styles.modalBtnPrimary}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {currentLevelIdx < LEVELS.length - 1
                    ? "Next Level ➡️"
                    : "Finish 🏆"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3ff", // violet-50
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd6fe",
  },
  headerBtn: {
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  headerBtnText: {
    fontSize: 20,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5b21b6",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#7c3aed",
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tutorialCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ede9fe",
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c4b5fd",
  },
  tutorialText: {
    flex: 1,
    marginLeft: 12,
    color: "#4c1d95",
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 22,
  },
  hintBtn: {
    alignSelf: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 20,
  },
  hintBtnText: {
    color: "#92400e",
    fontWeight: "600",
    fontSize: 14,
  },
  hintCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  hintText: {
    color: "#92400e",
    fontSize: 14,
    fontStyle: "italic",
  },
  gridContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  grid: {
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#94a3b8",
    position: "relative",
  },
  cell: {
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  cellEmpty: {
    backgroundColor: "white",
  },
  wall: {
    width: "90%",
    height: "90%",
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  goalEmoji: {
    fontSize: 28,
  },
  startEmoji: {
    fontSize: 20,
    opacity: 0.5,
  },
  coinEmoji: {
    fontSize: 24,
    position: "absolute",
  },
  collectedCoinEmoji: {
    fontSize: 20,
    opacity: 0.3,
  },
  rukoContainer: {
    position: "absolute",
    width: CELL_SIZE,
    height: CELL_SIZE,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8b5cf6",
    borderRadius: 4,
  },
  workspace: {
    margin: 16,
    marginTop: 24,
  },
  workspaceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  workspaceTitle: {
    fontWeight: "bold",
    color: "#334155",
    fontSize: 16,
  },
  workspaceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  blockCount: {
    color: "#64748b",
    fontSize: 14,
    marginRight: 12,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
  },
  clearBtnText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  programArea: {
    minHeight: 80,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptyText: {
    color: "#94a3b8",
    width: "100%",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  programBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 10,
    borderBottomWidth: 3,
  },
  programBlockVertical: {
    backgroundColor: "#3b82f6",
    borderBottomColor: "#1d4ed8",
  },
  programBlockHorizontal: {
    backgroundColor: "#6366f1",
    borderBottomColor: "#4338ca",
  },
  programBlockActive: {
    backgroundColor: "#fbbf24",
    borderBottomColor: "#d97706",
    transform: [{ scale: 1.1 }],
  },
  programBlockExecuted: {
    opacity: 0.5,
  },
  programBlockIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  programBlockNumber: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  toolbox: {
    margin: 16,
    marginTop: 8,
  },
  toolboxTitle: {
    fontWeight: "bold",
    color: "#334155",
    fontSize: 16,
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  blockBtn: {
    width: 72,
    height: 72,
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
    borderBottomColor: "#3730a3",
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  blockBtnDisabled: {
    opacity: 0.5,
  },
  blockBtnIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  blockBtnLabel: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  runBtn: {
    backgroundColor: "#22c55e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: "#16a34a",
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  runBtnDisabled: {
    backgroundColor: "#94a3b8",
    borderBottomColor: "#64748b",
  },
  runBtnIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  runBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 24,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5b21b6",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  modalBonus: {
    fontSize: 14,
    color: "#d97706",
    fontWeight: "600",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnSecondaryText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 16,
  },
  modalBtnPrimary: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: "#8b5cf6",
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnPrimaryText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
