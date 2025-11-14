import { format } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import messageService from "../services/messageService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";
import { Message } from "../types";

interface ChatScreenProps {
  route: {
    params: {
      conversationId: string;
      otherUserName: string;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { conversationId, otherUserName } = route.params;

  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = messageService.listenToMessages(
      conversationId,
      (msgs) => {
        setMessages(msgs);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      }
    );

    // Mark messages as read
    if (user) {
      messageService.markAsRead(conversationId, user.id);
    }

    return unsubscribe;
  }, [conversationId]);

  const handleSend = async () => {
    if (!user || !newMessage.trim()) return;

    try {
      await messageService.sendMessage(
        conversationId,
        user.id,
        newMessage.trim()
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;

    return (
      <View
        style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwn ? colors.primary : colors.surface,
            },
            isOwn && styles.ownMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwn ? "#FFFFFF" : colors.text },
              typography.body,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isOwn ? "rgba(255,255,255,0.7)" : colors.textTertiary },
              typography.caption,
            ]}
          >
            {format(new Date(item.createdAt), "HH:mm")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }, typography.body]}
          placeholder="Votre message..."
          placeholderTextColor={colors.textTertiary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!newMessage.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: newMessage.trim()
                ? colors.primary
                : colors.border,
            },
          ]}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  ownMessageBubble: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    marginBottom: 4,
  },
  messageTime: {},
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 18,
  },
});
