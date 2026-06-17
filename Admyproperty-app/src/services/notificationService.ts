import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { db } from '../../firebase';
import { doc, setDoc, getDocs, collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import Constants from 'expo-constants';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(uid: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get Project ID from app.json / EAS config
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
    if (!projectId) {
      console.log('Project ID not found. Ensure EAS is configured.');
      // return; // Fallback to legacy getExpoPushTokenAsync if needed, but better to provide projectId
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId || 'b9a95782-b7e1-45bd-bad4-1cf1a774ea05' // Fallback to hardcoded if not set
      })).data;
      
      // Save token to Firestore
      if (token && uid) {
        await setDoc(doc(db, 'users', uid), { pushToken: token }, { merge: true });
      }
    } catch (e) {
      console.log("Error getting push token:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleDailyReminder() {
  // Cancel all existing scheduled notifications first to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💰 Time to log expenses!",
      body: "Don't forget to track your spending today to stay on top of your finances.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20, // 8 PM
      minute: 0,
    },
  });
}

// Internal app notification
export async function createInAppNotification(toUid: string, fromUid: string, title: string, body: string) {
  try {
    await addDoc(collection(db, 'notifications'), {
      toUid,
      fromUid,
      title,
      body,
      read: false,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to create in-app notification:", error);
  }
}

// Send push notification via Expo API
export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Notify all executives
export async function notifyExecutives(fromUser: any, amount: number, desc: string) {
  try {
    // Only alert if amount is significant or if user wants all. 
    // We will just alert for all transactions as requested.
    const usersSnap = await getDocs(collection(db, 'users'));
    const executives = usersSnap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter((u: any) => ['ADMIN', 'MD', 'DIRECTOR'].includes(u.role));

    for (const exec of executives) {
      if ((exec as any).pushToken) {
        await sendPushNotification(
          (exec as any).pushToken,
          `New Transaction Logged`,
          `${fromUser.name} logged ₹${amount.toLocaleString('en-IN')} for ${desc}`
        );
      }
      
      // Also create in-app notification
      await createInAppNotification(
        exec.uid,
        fromUser.uid,
        `New Transaction Logged`,
        `${fromUser.name} logged ₹${amount.toLocaleString('en-IN')} for ${desc}`
      );
    }
  } catch (error) {
    console.error("Failed to notify executives:", error);
  }
}

// Notify chat participants
export async function notifyChatParticipants(chatId: string, fromUser: any, messageText: string) {
  try {
    const { getDoc } = require('firebase/firestore');
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) return;
    const participants = chatDoc.data().participants || [];
    
    // Get users
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter((u: any) => participants.includes(u.uid) && u.uid !== fromUser.uid);

    for (const u of users) {
      if ((u as any).pushToken) {
        await sendPushNotification(
          (u as any).pushToken,
          `New Message from ${fromUser.name}`,
          messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText
        );
      }
      
      await createInAppNotification(
        u.uid,
        fromUser.uid,
        `New Message from ${fromUser.name}`,
        messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText
      );
    }
  } catch (error) {
    console.error("Failed to notify chat participants:", error);
  }
}
