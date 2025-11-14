import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/ui/Card";
import { useTheme } from "../contexts/ThemeContext";
import messageService from "../services/messageService";
import userService from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";
import { Conversation } from "../types";

export const ConversationsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationUsers, setConversationUsers] = useState<Map<string, any>>(
    new Map()
  );

  useEffect(() => {
    if (!user) return;

    const unsubscribe = messageService.listenToConversations(
      user.id,
      async (convs) => {
        setConversations(convs);

        // Load other user info for each conversation
        const usersMap = new Map();
        for (const conv of convs) {
          const otherUserId = conv.participants.find((id) => id !== user.id);
          if (otherUserId) {
            const otherUser = await userService.getUserById(otherUserId);
            if (otherUser) {
              usersMap.set(conv.id, otherUser);
            }
          }
        }
        setConversationUsers(usersMap);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = conversationUsers.get(item.id);
    if (!otherUser) return null;

    return (
      <Card
        onPress={() =>
          navigation.navigate("Chat", {
            conversationId: item.id,
            otherUserName: otherUser.displayName,
          })
        }
        style={styles.conversationCard}
      >
        <Image
          source={{
            uri: otherUser.photoURL || "https://via.placeholder.com/50",
          }}
          style={styles.avatar}
        />
        <View style={styles.conversationInfo}>
          <Text
            style={[
              styles.userName,
              { color: colors.text },
              typography.bodyMedium,
            ]}
          >
            {otherUser.displayName}
          </Text>
          {item.lastMessage && (
            <>
              <Text
                style={[
                  styles.lastMessage,
                  { color: colors.textSecondary },
                  typography.small,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.text}
              </Text>
              <Text
                style={[
                  styles.time,
                  { color: colors.textTertiary },
                  typography.caption,
                ]}
              >
                {format(new Date(item.lastMessage.createdAt), "HH:mm")}
              </Text>
            </>
          )}
        </View>
      </Card>
    );
  };

  if (conversations.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.emptyContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[
            styles.emptyText,
            { color: colors.textSecondary },
            typography.body,
          ]}
        >
          Aucune conversation
        </Text>
        <Text
          style={[
            styles.emptySubtext,
            { color: colors.textTertiary },
            typography.small,
          ]}
        >
          Commence une discussion avec tes amis !
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
  },
  list: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  conversationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    marginBottom: 4,
  },
  lastMessage: {
    marginBottom: 2,
  },
  time: {},
});
