import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import LivingRuko from '../../components/ruko/LivingRuko';
import { useUserStore } from '../../store/userStore';
import * as ChatAI from '../../services/ai/chatAI';
import { Audio } from 'expo-av';

interface RukoChatProps {
  className: 'science' | 'coding' | 'history';
  currentTopic?: string;
  onBack: () => void;
}

export default function RukoChat({ className, currentTopic, onBack }: RukoChatProps) {
  const { age, level, name } = useUserStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatAI.ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rukoEmotion, setRukoEmotion] = useState<'happy' | 'thinking' | 'excited' | 'sad'>('happy');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const suggestions = ChatAI.getSuggestedQuestions({
    className,
    currentTopic,
    recentLessons: [],
    userAge: age,
    userLevel: level,
    conversationHistory: messages
  });

  // Welcome message
  useEffect(() => {
    const welcomeMessages = {
      science: `Hi ${name}! I'm Ruko, your science buddy! 🔬 Ask me anything about how the world works!`,
      coding: `Hey ${name}! Ready to learn some coding magic? 💻 Ask me anything about programming!`,
      history: `Hello ${name}! Let's explore the past together! 📚 Ask me anything about history!`
    };

    const welcomeMsg: ChatAI.ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessages[className],
      timestamp: Date.now(),
      emotion: 'happy'
    };

    setMessages([welcomeMsg]);
  }, [className, name]);

  const playSound = async (type: 'pop' | 'send') => {
    if (Platform.OS === 'web') return;

    try {
      const source = type === 'send'
        ? require('../../../assets/audio/sfx/pop.mp3')
        : require('../../../assets/audio/sfx/pop.mp3');

      const { sound } = await Audio.Sound.createAsync(source);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      // Silent fail
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();

    if (!messageText) return;

    // Safety check
    const safetyCheck = ChatAI.checkMessageSafety(messageText);
    if (!safetyCheck.safe) {
      const warningMsg: ChatAI.ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: safetyCheck.reason || "Let's talk about something else! 😊",
        timestamp: Date.now(),
        emotion: 'sad'
      };
      setMessages(prev => [...prev, warningMsg]);
      setInputText('');
      return;
    }

    playSound('send');
    Keyboard.dismiss();
    setShowSuggestions(false);

    // Add user message
    const userMsg: ChatAI.ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setRukoEmotion('thinking');

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get AI response
      const context: ChatAI.ChatContext = {
        className,
        currentTopic,
        recentLessons: [],
        userAge: age,
        userLevel: level,
        conversationHistory: messages
      };

      const { response, emotion } = await ChatAI.sendChatMessage(messageText, context);

      // Add assistant message
      const assistantMsg: ChatAI.ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        emotion: emotion || 'happy'
      };

      setMessages(prev => [...prev, assistantMsg]);
      setRukoEmotion(emotion || 'happy');

      playSound('pop');

    } catch (error) {
      console.error('Chat error:', error);

      const errorMsg: ChatAI.ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! My circuits got a bit tangled. Can you ask that again? 🤖",
        timestamp: Date.now(),
        emotion: 'sad'
      };

      setMessages(prev => [...prev, errorMsg]);
      setRukoEmotion('sad');
    } finally {
      setIsTyping(false);

      // Scroll to bottom after response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const getClassIcon = () => {
    const icons = {
      science: '🔬',
      coding: '💻',
      history: '📚'
    };
    return icons[className];
  };

  const getClassColor = () => {
    const colors = {
      science: 'bg-emerald-500',
      coding: 'bg-purple-500',
      history: 'bg-amber-500'
    };
    return colors[className];
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className={`${getClassColor()} px-6 py-4 flex-row items-center justify-between shadow-lg`}>
          <TouchableOpacity
            onPress={onBack}
            className="bg-white/20 p-2 rounded-full"
          >
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Text className="text-3xl mr-2">{getClassIcon()}</Text>
            <View>
              <Text className="text-white font-bold text-lg">Chat with Ruko</Text>
              <Text className="text-white/80 text-xs">
                {className.charAt(0).toUpperCase() + className.slice(1)} Class
              </Text>
            </View>
          </View>

          <View className="w-10" />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => (
            <Animated.View
              key={msg.id}
              entering={index === 0 ? FadeIn : FadeInUp.delay(100)}
            >
              {msg.role === 'assistant' ? (
                // Ruko's message
                <View className="flex-row items-end mb-4 mr-12">
                  <View className="mr-2">
                    <LivingRuko
                      emotion={msg.emotion || rukoEmotion}
                      size={50}
                    />
                  </View>
                  <View className="flex-1 bg-white p-4 rounded-2xl rounded-bl-none shadow-sm">
                    <Text className="text-slate-800 text-base leading-6">
                      {msg.content}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              ) : (
                // User's message
                <View className="flex-row items-end mb-4 ml-12 justify-end">
                  <View className={`flex-1 ${getClassColor()} p-4 rounded-2xl rounded-br-none shadow-sm`}>
                    <Text className="text-white text-base leading-6">
                      {msg.content}
                    </Text>
                    <Text className="text-white/70 text-xs mt-2 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <Animated.View
              entering={FadeIn}
              className="flex-row items-center mb-4"
            >
              <View className="mr-2">
                <LivingRuko emotion="thinking" size={50} />
              </View>
              <View className="bg-white p-4 rounded-2xl shadow-sm">
                <View className="flex-row gap-1">
                  <View className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <View className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                  <View className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {showSuggestions && messages.length === 1 && (
          <Animated.View
            entering={FadeInDown.delay(300)}
            className="px-4 pb-2"
          >
            <Text className="text-slate-500 text-xs font-semibold mb-2">
              💡 TRY ASKING:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2"
            >
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestionPress(suggestion)}
                  className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm active:scale-95"
                >
                  <Text className="text-slate-700 text-sm">
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input */}
        <View className="px-4 py-3 bg-white border-t border-slate-200">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 bg-slate-100 rounded-full px-4 py-3 flex-row items-center">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask Ruko anything..."
                placeholderTextColor="#94a3b8"
                className="flex-1 text-slate-800 text-base"
                multiline
                maxLength={500}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
              />
              <Text className="text-slate-400 text-xs">
                {inputText.length}/500
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isTyping}
              className={`${
                inputText.trim() && !isTyping
                  ? getClassColor()
                  : 'bg-slate-300'
              } w-12 h-12 rounded-full items-center justify-center shadow-lg active:scale-95`}
            >
              {isTyping ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-xl">➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
