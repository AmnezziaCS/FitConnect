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

class MessageService {
  // Get or create conversation
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
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
    );
  }

  // Listen to conversations (real-time)
  listenToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ) {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
      );
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
