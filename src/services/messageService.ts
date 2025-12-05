import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Conversation, Message } from "../types";
import notificationService from "./notificationService";
import userService from "./userService";

class MessageService {
  // conversation
  async getOrCreateConversation(
    userId: string,
    otherUserId: string
  ): Promise<string> {
    const participants = [userId, otherUserId].sort();

    // Check if conversation exists
    const q = query(
      collection(db, "conversations"),
      where("participants", "==", participants)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new conversation
    const conversation: Omit<Conversation, "id"> = {
      participants,
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "conversations"), conversation);
    return docRef.id;
  }

  // Send message
  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<void> {
    const message: Omit<Message, "id"> = {
      conversationId,
      senderId,
      text,
      createdAt: new Date(),
      read: false,
    };

    const messageRef = await addDoc(collection(db, "messages"), message);

    // Update conversation's last message
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessage: { ...message, id: messageRef.id },
      updatedAt: new Date(),
    });

    // Send notification to the other participant
    try {
      const convSnap = await (await import("firebase/firestore")).getDoc(conversationRef);
      if (convSnap.exists()) {
        const conv = convSnap.data() as Conversation;
        const otherParticipants = conv.participants.filter((p) => p !== senderId);
        const sender = await userService.getUserById(senderId);
        const senderName = sender?.displayName || "Quelqu'un";
        for (const otherId of otherParticipants) {
          await notificationService.sendMessageNotification(
            otherId,
            senderName,
            conversationId,
            text.substring(0, 100)
          );
        }
      }
    } catch (e) {
      // ignore notification errors
      console.warn("Failed to send message notification:", e);
    }
  }

  // Get messages for conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Message)
    );
  }

  // Listen to messages (real-time)
  listenToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ) {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
      callback(messages);
    });
  }

  // Get user conversations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    // Avoid requiring a composite index by not ordering server-side when
    // using `array-contains`. We fetch matching conversations and sort
    // locally by `updatedAt` descending.
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const convs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
    );

    convs.sort((a, b) => {
      const aTime = a.updatedAt && (a.updatedAt.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt).getTime());
      const bTime = b.updatedAt && (b.updatedAt.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt).getTime());
      return (bTime || 0) - (aTime || 0);
    });

    return convs;
  }

  // Listen to conversations (real-time)
  listenToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ) {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
      );

      // Sort locally by updatedAt desc
      conversations.sort((a, b) => {
        const aTime = a.updatedAt && (a.updatedAt.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt).getTime());
        const bTime = b.updatedAt && (b.updatedAt.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt).getTime());
        return (bTime || 0) - (aTime || 0);
      });

      callback(conversations);
    });
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("senderId", "!=", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
  }
}

export default new MessageService();
