import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../components/ui/Button";
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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

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
        <View style={{ width: '100%', marginTop: 16 }}>
          <Button title="Démarrer une discussion" onPress={() => setShowMessageModal(true)} />
        </View>
        {showMessageModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}> 
              <Text style={[{ marginBottom: 8 }, typography.body]}>Email de l'utilisateur :</Text>
              <TextInput
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                placeholder="utilisateur@exemple.com"
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <Button title="Annuler" onPress={() => { setShowMessageModal(false); setRecipientEmail(''); }} variant="outline" style={{ flex: 1, marginRight: 8 }} />
                <Button title="Démarrer" onPress={async () => {
                  if (!recipientEmail.trim() || !user) return;
                  try {
                    const results = await userService.searchUsers(recipientEmail.trim());
                    if (!results || results.length === 0) {
                      // Helpful debugging: in many cases the account exists in Firebase Auth
                      // but no Firestore `users` document was created (e.g. users added via
                      // the Firebase Console). The client can only search Firestore, so
                      // show guidance to the developer/user.
                      console.warn("No Firestore user found for email:", recipientEmail);
                      Alert.alert(
                        "Utilisateur introuvable",
                        "Aucun profil utilisateur trouvé dans Firestore pour cet email. Si vous avez créé le compte depuis la console Firebase, créez aussi le document dans la collection `users`, ou utilisez une Cloud Function/Admin SDK pour synchroniser les comptes."
                      );
                      return;
                    }
                    const other = results[0];
                    const convId = await messageService.getOrCreateConversation(user.id, other.id);
                    setShowMessageModal(false);
                    setRecipientEmail("");
                    navigation.navigate("Chat", { conversationId: convId, otherUserName: other.displayName });
                  } catch (e: any) {
                    Alert.alert("Erreur", e.message || "Impossible de démarrer la conversation");
                  }
                }} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: 16 }}>
        <Button title="Démarrer une discussion" onPress={() => setShowMessageModal(true)} />
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.list}
      />
      {showMessageModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}> 
            <Text style={[{ marginBottom: 8 }, typography.body]}>Email de l'utilisateur :</Text>
            <TextInput
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="utilisateur@exemple.com"
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <Button title="Annuler" onPress={() => { setShowMessageModal(false); setRecipientEmail(''); }} variant="outline" style={{ flex: 1, marginRight: 8 }} />
              <Button title="Démarrer" onPress={async () => {
                if (!recipientEmail.trim() || !user) return;
                try {
                  const results = await userService.searchUsers(recipientEmail.trim());
                  if (!results || results.length === 0) {
                    console.warn("No Firestore user found for email:", recipientEmail);
                    Alert.alert(
                      "Utilisateur introuvable",
                      "Aucun profil utilisateur trouvé dans Firestore pour cet email. Si vous avez créé le compte depuis la console Firebase, créez aussi le document dans la collection `users`, ou utilisez une Cloud Function/Admin SDK pour synchroniser les comptes."
                    );
                    return;
                  }
                  const other = results[0];
                  const convId = await messageService.getOrCreateConversation(user.id, other.id);
                  setShowMessageModal(false);
                  setRecipientEmail("");
                  navigation.navigate("Chat", { conversationId: convId, otherUserName: other.displayName });
                } catch (e: any) {
                  Alert.alert("Erreur", e.message || "Impossible de démarrer la conversation");
                }
              }} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
