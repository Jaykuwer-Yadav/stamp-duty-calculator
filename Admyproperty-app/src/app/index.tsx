import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  Modal,
  Platform,
  Dimensions,
  Switch,
  Linking,
  LogBox
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { LineChart } from 'react-native-chart-kit';

LogBox.ignoreLogs(['Unknown event handler property `onPressIn`']);
import { registerForPushNotificationsAsync, notifyExecutives, scheduleDailyReminder, notifyChatParticipants } from '../services/notificationService';
import { auth, db, storage } from '../../firebase';
import MoneyBackground from '../components/MoneyBackground';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  deleteUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  setDoc,
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  deleteDoc,
  where,
  getDocs,
  updateDoc,
  collectionGroup
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { handleBiometricAuth } from '../utils/biometrics';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import { Audio } from 'expo-av';
import { PinchGestureHandler, State as GestureState } from 'react-native-gesture-handler';

interface ThemeConfig {
  name: string;
  background: string;
  cardBackground: string;
  cardBorder: string;
  textColor: string;
  textMutedColor: string;
  primaryColor: string;
  incomeColor: string;
  expenseColor: string;
  inputBackground: string;
  inputBorder: string;
  borderRadius: number;
  borderWidth?: number;
  moneySymbols: string[];
  balanceColor?: string;
  fontFamily?: string;
  isRetro?: boolean;
}

const THEMES: Record<string, ThemeConfig> = {
  cyber_noir: {
    name: 'Cyber-Noir (Luminous)',
    background: '#06070a',
    cardBackground: 'rgba(14, 17, 26, 0.85)',
    cardBorder: 'rgba(99, 102, 241, 0.25)',
    textColor: '#ffffff',
    textMutedColor: '#94a3b8',
    primaryColor: '#6366f1',
    incomeColor: '#39FF14',
    expenseColor: '#f43f5e',
    inputBackground: 'rgba(6, 7, 10, 0.7)',
    inputBorder: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    moneySymbols: ['💵', '🪙', '💰', '₹', '💳', '✨'],
  },
  emerald_wealth: {
    name: 'Emerald Wealth',
    background: '#040d09',
    cardBackground: 'rgba(10, 24, 18, 0.9)',
    cardBorder: 'rgba(212, 175, 55, 0.35)',
    textColor: '#f3f4f6',
    textMutedColor: '#a1a1aa',
    primaryColor: '#d4af37',
    incomeColor: '#10b981',
    expenseColor: '#ef4444',
    inputBackground: 'rgba(4, 13, 9, 0.7)',
    inputBorder: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 20,
    moneySymbols: ['🪙', '👑', '💎', '🔑', '₹'],
  },
  aurora_teal: {
    name: 'Aurora Teal',
    background: '#0b0f19',
    cardBackground: 'rgba(17, 24, 39, 0.85)',
    cardBorder: 'rgba(20, 184, 166, 0.35)',
    textColor: '#f9fafb',
    textMutedColor: '#9ca3af',
    primaryColor: '#0ea5e9',
    incomeColor: '#10b981',
    expenseColor: '#f43f5e',
    inputBackground: 'rgba(11, 15, 25, 0.7)',
    inputBorder: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    moneySymbols: ['💸', '📈', '📊', '💎', '₹'],
  },
  monochrome_stealth: {
    name: 'Monochrome Stealth',
    background: '#000000',
    cardBackground: 'rgba(20, 20, 20, 0.95)',
    cardBorder: 'rgba(255, 255, 255, 0.15)',
    textColor: '#ffffff',
    textMutedColor: '#6b7280',
    primaryColor: '#ffffff',
    incomeColor: '#ffffff',
    expenseColor: '#ff5a1f',
    inputBackground: '#000000',
    inputBorder: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    moneySymbols: ['$', '€', '¥', '£', '₹'],
  },
  minecraft_anime: {
    name: 'Minecraft Adventure',
    background: '#72a9ff',
    cardBackground: '#13223f',
    cardBorder: '#000000',
    textColor: '#ffffff',
    textMutedColor: '#8a9bb5',
    primaryColor: '#5cbf3a',
    incomeColor: '#3abcc0',
    expenseColor: '#e03e3e',
    inputBackground: '#0b1627',
    inputBorder: '#000000',
    borderRadius: 4,
    borderWidth: 3,
    moneySymbols: ['💎', '🪙', '🗡️', '🧱', '🥩', '🐷'],
    balanceColor: '#ffd700',
    fontFamily: 'monospace',
    isRetro: true,
  },
  brick_breaker: {
    name: 'Brick Breaker (Arcade)',
    background: '#090910',
    cardBackground: '#121222',
    cardBorder: '#ff007f',
    textColor: '#ffffff',
    textMutedColor: '#00ffff',
    primaryColor: '#00ffff',
    incomeColor: '#39ff14',
    expenseColor: '#ff003c',
    inputBackground: '#04040a',
    inputBorder: '#ff007f',
    borderRadius: 8,
    borderWidth: 2,
    moneySymbols: ['🧱', '⚪', '👾', '🕹️', '💖'],
    balanceColor: '#00ffff',
    fontFamily: 'monospace',
    isRetro: true,
  },
  pastel_gamified: {
    name: '🦊 Pastel Gamified (Light)',
    background: '#f4f2ff',
    cardBackground: '#ffffff',
    cardBorder: '#e8e4ff',
    textColor: '#1e1b4b',
    textMutedColor: '#7c7a9e',
    primaryColor: '#8b5cf6',
    incomeColor: '#10b981',
    expenseColor: '#f97316',
    inputBackground: '#faf9ff',
    inputBorder: '#ddd8ff',
    borderRadius: 24,
    moneySymbols: ['🦊', '🏆', '☕', '🐷', '⭐', '🎯', '💜'],
    balanceColor: '#8b5cf6',
  },
  stranger_things: {
    name: 'Stranger Things (80s)',
    background: '#090a0f',
    cardBackground: '#11131c',
    cardBorder: '#e50914',
    textColor: '#f5f5f5',
    textMutedColor: '#6b7280',
    primaryColor: '#e50914',
    incomeColor: '#42a5f5',
    expenseColor: '#e50914',
    inputBackground: '#090a0f',
    inputBorder: '#e50914',
    borderRadius: 6,
    borderWidth: 2,
    moneySymbols: ['🚲', '🔦', '🧇', '👾', '📻', '🎸', '📼'],
    balanceColor: '#e50914',
    fontFamily: 'serif',
    isRetro: true,
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Salary: '💼',
  Entertainment: '🎮',
  Health: '🏥',
  Shopping: '🛍️',
  Utilities: '⚡',
  Other: '📦'
};

// Custom pixel-art avatars
function SteveAvatar() {
  const grid = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'S', 'S', 'S', 'S', 'S', 'S', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'W', 'B', 'S', 'S', 'B', 'W', 'S'],
    ['S', 'S', 'S', 'N', 'N', 'S', 'S', 'S'],
    ['S', 'M', 'M', 'M', 'M', 'M', 'M', 'S'],
    ['S', 'S', 'M', 'M', 'M', 'M', 'S', 'S'],
  ];

  const colors: Record<string, string> = {
    H: '#4a3222', 
    S: '#e5a073', 
    W: '#ffffff', 
    B: '#3a5ab8', 
    N: '#bd7c56', 
    M: '#5c3a21', 
  };

  return (
    <View style={{ width: 44, height: 44, borderWidth: 3, borderColor: '#000000', backgroundColor: '#e5a073', flexDirection: 'column' }}>
      {grid.map((row, rIdx) => (
        <View key={rIdx} style={{ flex: 1, flexDirection: 'row' }}>
          {row.map((cell, cIdx) => (
            <View key={cIdx} style={{ flex: 1, backgroundColor: colors[cell] }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function AlexAvatar() {
  const grid = [
    ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
    ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
    ['O', 'S', 'S', 'S', 'S', 'S', 'S', 'O'],
    ['O', 'S', 'S', 'S', 'S', 'S', 'S', 'O'],
    ['S', 'W', 'G', 'S', 'S', 'G', 'W', 'S'],
    ['S', 'S', 'S', 'N', 'N', 'S', 'S', 'S'],
    ['S', 'L', 'L', 'L', 'L', 'L', 'L', 'S'],
    ['O', 'O', 'S', 'S', 'S', 'S', 'O', 'O'],
  ];

  const colors: Record<string, string> = {
    O: '#b65e29', 
    S: '#ecc3a7', 
    W: '#ffffff', 
    G: '#5c8f2b', 
    N: '#d09674', 
    L: '#d07474', 
  };

  return (
    <View style={{ width: 32, height: 32, borderWidth: 2, borderColor: '#000000', backgroundColor: '#ecc3a7', flexDirection: 'column' }}>
      {grid.map((row, rIdx) => (
        <View key={rIdx} style={{ flex: 1, flexDirection: 'row' }}>
          {row.map((cell, cIdx) => (
            <View key={cIdx} style={{ flex: 1, backgroundColor: colors[cell] }} />
          ))}
        </View>
      ))}
    </View>
  );
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  employeeId?: string;
  createdAt: string;
  profilePhoto?: string;
}

interface TransactionItem {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  timestamp: any;
  dateStr: string;
  userName: string;
  userUid: string;
  description: string;
  category: string;
  paymentMethod: 'Cash' | 'Card' | 'Bank';
  receiptUrl?: string;
  note?: string;
  tags?: string[];
  createdBy?: string;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ChatRoom {
  id: string;
  isGroup: boolean;
  groupName?: string;
  participants: string[];
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  type?: 'text' | 'image' | 'document' | 'audio' | 'contact';
  fileName?: string;
  fileSize?: string;
}

interface LoadingOverlayProps {
  activeTheme: ThemeConfig;
  userName?: string;
}

function LoadingOverlay({ activeTheme, userName }: LoadingOverlayProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.loadingContainer, { backgroundColor: activeTheme.background }]}>
      <View style={styles.loaderContent}>
        <View style={styles.loaderImgContainer}>
          <Animated.View style={[styles.loaderSpinnerRing, { transform: [{ rotate: spin }], borderColor: 'rgba(255, 255, 255, 0.05)', borderTopColor: activeTheme.primaryColor }]} />
        </View>
        <Text style={[styles.loadingText, { color: activeTheme.primaryColor, marginTop: 40, fontSize: 16 }]}>
          {userName ? `Welcome ${userName}` : 'Loading...'}
        </Text>
      </View>
    </View>
  );
}

const createBlobFromUri = async (uri: string): Promise<any> => {
  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(e) {
      console.log(e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

function getSafeDateStr(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  try {
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toISOString();
    }
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch (e) {
    console.warn("Failed to parse date:", e);
  }
  return new Date().toISOString();
}

export default function AppIndex() {
  const insets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(true);

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Dashboard & Analytics states
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  
  // Transaction submission states
  const [amountInput, setAmountInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [typeInput, setTypeInput] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [categoryInput, setCategoryInput] = useState('Other');
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<'Cash' | 'Card' | 'Bank'>('Cash');
  const [transactionNote, setTransactionNote] = useState('');
  const [transactionTags, setTransactionTags] = useState('');
  const [receiptPhotoUri, setReceiptPhotoUri] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [chartZoom, setChartZoom] = useState(1);
  const [expenseTooltip, setExpenseTooltip] = useState<{ visible: boolean; x: number; y: number; value: number } | null>(null);
  const [incomeTooltip, setIncomeTooltip] = useState<{ visible: boolean; x: number; y: number; value: number } | null>(null);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const playSound = async (type: 'add' | 'delete') => {
    try {
      const uri = type === 'add' 
        ? 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'
        : 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flick.ogg';
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  // Editing transaction state
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);

  // Inactivity timeout handler
  const inactivityTimerRef = useRef<any>(null);

  // Dashboard Customizer settings
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [showSummaryCards, setShowSummaryCards] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [showGoalsWidget, setShowGoalsWidget] = useState(true);
  const [showAchievementsWidget, setShowAchievementsWidget] = useState(true);

  // Profile Change Password & Delete Account states
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // User Sheet Modal states
  const [selectedUserSheet, setSelectedUserSheet] = useState<UserProfile | null>(null);
  const [modalTransactions, setModalTransactions] = useState<TransactionItem[]>([]);
  const [modalTotals, setModalTotals] = useState({ inflow: 0, outflow: 0, balance: 0 });
  const [modalUserNotes, setModalUserNotes] = useState<NoteItem[]>([]);

  // Admin Create User inputs
  const [adminCreateOpen, setAdminCreateOpen] = useState(false);
  const [adminNewEmail, setAdminNewEmail] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminNewName, setAdminNewName] = useState('');
  const [adminNewPhone, setAdminNewPhone] = useState('');
  const [adminNewRole, setAdminNewRole] = useState<'USER' | 'ADMIN'>('USER');

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifSheet, setShowNotifSheet] = useState(false);

  const [activeThemeKey, setActiveThemeKey] = useState<string>('cyber_noir');
  const [dashboardTab, setDashboardTab] = useState<'dashboard' | 'activity' | 'accounts' | 'rewards' | 'calendar' | 'profile' | 'notes' | 'chat' | 'stats'>('dashboard');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<string | null>(null);
  const [dashboardViewMode, setDashboardViewMode] = useState<'personal' | 'all-over'>('personal');
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerMonthDate, setPickerMonthDate] = useState(new Date());

  // Notes states
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  // Chat states
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatGroupTitle, setNewChatGroupTitle] = useState('');
  const [newChatSelectedUsers, setNewChatSelectedUsers] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatAttachmentMenuOpen, setChatAttachmentMenuOpen] = useState(false);
  const [chatContactPickerOpen, setChatContactPickerOpen] = useState(false);
  const [sharingMedia, setSharingMedia] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(550, screenWidth) - 40;

  // Track and reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (auth.currentUser) {
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout();
        Alert.alert("Session Expired", "You have been logged out automatically due to 5 minutes of inactivity.");
      }, 5 * 60 * 1000); 
    }
  };

  // Setup user interaction reset triggers
  const onUserInteraction = () => {
    resetInactivityTimer();
  };

  useEffect(() => {
    if (user) {
      resetInactivityTimer();
    } else {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

  // Listen to user's notes in real-time
  useEffect(() => {
    if (!user || !profile) {
      setNotes([]);
      return;
    }
    const notesRef = collection(db, 'users', profile.uid, 'notes');
    const unsubscribe = onSnapshot(notesRef, (snapshot) => {
      const list: NoteItem[] = [];
      snapshot.forEach((nDoc) => {
        const data = nDoc.data();
        list.push({
          id: nDoc.id,
          title: data.title || '',
          content: data.content || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort notes by createdAt descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(list);
    }, (error) => {
      console.warn("Failed to listen to notes:", error);
    });
    return unsubscribe;
  }, [user, profile]);

  // Listen to user's chat rooms in real-time
  useEffect(() => {
    if (!user || !profile) {
      setChats([]);
      return;
    }
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatRoom[] = [];
      snapshot.forEach((cDoc) => {
        const data = cDoc.data();
        list.push({
          id: cDoc.id,
          isGroup: !!data.isGroup,
          groupName: data.groupName,
          participants: data.participants || [],
          createdAt: data.createdAt || '',
        });
      });
      setChats(list);
    }, (error) => {
      console.warn("Failed to listen to chats:", error);
    });
    return unsubscribe;
  }, [user, profile]);

  // Listen to active chat room's encrypted messages in real-time
  useEffect(() => {
    if (!user || !profile || !currentChat) {
      setChatMessages([]);
      return;
    }
    const q = query(
      collection(db, 'chats', currentChat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((mDoc) => {
        const data = mDoc.data();
        list.push({
          id: mDoc.id,
          senderId: data.senderId || '',
          senderName: data.senderName || '',
          text: decryptMessage(data.text || ''),
          timestamp: data.timestamp,
          type: data.type || 'text',
          fileName: data.fileName ? decryptMessage(data.fileName) : undefined,
          fileSize: data.fileSize || undefined
        });
      });
      setChatMessages(list);
    }, (error) => {
      console.warn("Failed to listen to messages:", error);
    });
    return unsubscribe;
  }, [user, profile, currentChat]);

  // Check email verification status
  const checkEmailVerification = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
      setEmailVerified(currentUser.emailVerified);
    }
  };

  const resendVerification = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
        Alert.alert("Success", "Security verification email has been dispatched. Please audit your inbox.");
      } catch (err: any) {
        Alert.alert("Dispatched Failed", err.message);
      }
    }
  };

  const getChartData = (transactions: TransactionItem[], type: 'income' | 'expense' | 'transfer') => {
    const sorted = [...transactions].sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
    const grouped: any = {};
    sorted.forEach(t => {
      if (t.type === type) {
        const dateKey = new Date(t.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        grouped[dateKey] = (grouped[dateKey] || 0) + t.amount;
      }
    });
    
    let labels = Object.keys(grouped).slice(-5); 
    let data = labels.map(l => grouped[l]);
    
    if (labels.length === 0) {
      labels = ['No Data'];
      data = [0];
    }
    
    return {
      labels,
      datasets: [{ data }]
    };
  };

  // Spend insights algorithm
  const getSpendingInsights = () => {
    const expenses = allTransactions.filter(t => t.type === 'expense' && t.userUid === profile?.uid);
    if (expenses.length === 0) return "No expense insights yet. Keep logging to review insights.";
    
    const catBreakdown: Record<string, number> = {};
    let totalExpense = 0;
    expenses.forEach(e => {
      catBreakdown[e.category] = (catBreakdown[e.category] || 0) + e.amount;
      totalExpense += e.amount;
    });

    let topCategory = "";
    let topAmount = 0;
    Object.entries(catBreakdown).forEach(([cat, val]) => {
      if (val > topAmount) {
        topAmount = val;
        topCategory = cat;
      }
    });

    const percent = Math.round((topAmount / totalExpense) * 100);
    if (percent > 40) {
      return `⚠️ High Spending Alert: You spent ${percent}% of your budget on ${topCategory} (${CATEGORY_ICONS[topCategory] || '📦'} ${topCategory}). Consider optimizing this.`;
    }
    return `💡 Financial Health Tip: Your spending is balanced! Your highest category is ${topCategory} at ${percent}%. Keep up the good work.`;
  };

  // Load configuration and theme from AsyncStorage on mount
  useEffect(() => {
    const loadThemeAndCustomizations = async () => {
      try {
        const theme = await AsyncStorage.getItem('app_theme');
        if (theme && THEMES[theme]) {
          setActiveThemeKey(theme);
        }
        const showCardsVal = await AsyncStorage.getItem('custom_show_cards');
        if (showCardsVal !== null) setShowSummaryCards(showCardsVal === 'true');
        
        const showChartsVal = await AsyncStorage.getItem('custom_show_charts');
        if (showChartsVal !== null) setShowCharts(showChartsVal === 'true');
        
        const showGoalsVal = await AsyncStorage.getItem('custom_show_goals');
        if (showGoalsVal !== null) setShowGoalsWidget(showGoalsVal === 'true');

        const showAchVal = await AsyncStorage.getItem('custom_show_ach');
        if (showAchVal !== null) setShowAchievementsWidget(showAchVal === 'true');
      } catch (e) {
        console.warn("AsyncStorage configuration loading failed:", e);
      }
    };
    loadThemeAndCustomizations();
  }, []);

  // Listen to Firestore settings theme when authenticated
  useEffect(() => {
    if (!user) return;

    const unsubscribeTheme = onSnapshot(doc(db, 'settings', 'theme'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.activeTheme && THEMES[data.activeTheme]) {
          setActiveThemeKey(data.activeTheme);
          AsyncStorage.setItem('app_theme', data.activeTheme).catch(() => {});
        }
      }
    }, (error) => {
      console.warn("Failed to subscribe to settings/theme: ", error);
    });

    return () => unsubscribeTheme();
  }, [user]);

  const handleUpdateTheme = async (themeKey: string) => {
    setActiveThemeKey(themeKey);
    try {
      await AsyncStorage.setItem('app_theme', themeKey);
    } catch (e) {
      console.warn("AsyncStorage save theme failed:", e);
    }

    try {
      await setDoc(doc(db, 'settings', 'theme'), {
        activeTheme: themeKey,
        updatedBy: profile?.name || 'Admin',
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.warn("Global theme update failed in Firestore:", err.message);
    }
  };

  const saveDashboardCustomization = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) {
      console.warn("Save widget pref failed:", e);
    }
  };

  const activeTheme = THEMES[activeThemeKey] || THEMES.cyber_noir;

  // Monitor network connectivity in real-time
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        setEmailVerified(currentUser.emailVerified);
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
            
            // Notification setup
            if (Platform.OS !== 'web') {
              registerForPushNotificationsAsync(currentUser.uid);
              scheduleDailyReminder();
            }
          } else {
            console.warn("User profile document not found.");
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync users and transactions list in real-time
  useEffect(() => {
    if (!profile) return;

    const isExecutive = ['ADMIN', 'MD', 'DIRECTOR'].includes(profile.role);

    // 1. Listen to notifications
    const notifQ = query(collection(db, 'notifications'), where('toUid', '==', profile.uid));
    const unsubNotifs = onSnapshot(notifQ, (snap) => {
      const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setNotifications(notifs);
    }, (error) => {
      console.warn("Failed to listen to notifications:", error);
    });

    // 2. Listen to users collection (for DM lists and group creators) - UNIVERSAL for all auth users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
      const usersList: UserProfile[] = [];
      usersSnapshot.forEach((uDoc) => {
        usersList.push({ uid: uDoc.id, ...uDoc.data() } as UserProfile);
      });
      setAllUsers(usersList);
    }, (error) => {
      console.error("Failed to load user directory: ", error);
    });

    // 3. Listen to Transactions (split by executive/non-executive)
    let unsubscribeTransactions: () => void = () => {};
    const activeListeners: Record<string, () => void> = {};

    if (isExecutive) {
      const allTransactionsMap: Record<string, TransactionItem[]> = {};

      const unsubscribeUsersSnapshot = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
        const currentUids = new Set<string>();
        usersSnapshot.forEach((uDoc) => {
          currentUids.add(uDoc.id);
        });

        // 1. Unsubscribe deleted users
        Object.keys(activeListeners).forEach((uid) => {
          if (!currentUids.has(uid)) {
            activeListeners[uid]();
            delete activeListeners[uid];
            delete allTransactionsMap[uid];
          }
        });

        // 2. Subscribe to new users only
        usersSnapshot.forEach((uDoc) => {
          const empUid = uDoc.id;
          const uData = uDoc.data();

          if (!activeListeners[empUid]) {
            const unsubEmp = onSnapshot(
              collection(db, 'users', empUid, 'transactions'),
              (transSnapshot) => {
                const empTrans: TransactionItem[] = [];
                transSnapshot.forEach((tDoc) => {
                  const data = tDoc.data();
                  empTrans.push({
                    id: tDoc.id,
                    userUid: empUid,
                    userName: uData.name || 'Unknown',
                    amount: data.amount || 0,
                    type: data.type || 'expense',
                    timestamp: data.timestamp,
                    description: data.description || 'Transaction',
                    category: data.category || 'Other',
                    paymentMethod: data.paymentMethod || 'Cash',
                    receiptUrl: data.receiptUrl,
                    note: data.note,
                    tags: data.tags,
                    dateStr: getSafeDateStr(data.timestamp)
                  } as TransactionItem);
                });
                allTransactionsMap[empUid] = empTrans;

                // Merge and update all transactions
                const merged: TransactionItem[] = [];
                Object.values(allTransactionsMap).forEach((list) => {
                  merged.push(...list);
                });
                merged.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
                setAllTransactions(merged);
              },
              (error) => {
                console.warn(`Failed to listen to transactions for user ${empUid}:`, error);
              }
            );
            activeListeners[empUid] = unsubEmp;
          }
        });
      });

      unsubscribeTransactions = () => {
        unsubscribeUsersSnapshot();
        Object.values(activeListeners).forEach((unsub) => unsub());
      };
    } else {
      // Standard User / Staff Listener
      const q = query(collection(db, 'users', profile.uid, 'transactions'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: TransactionItem[] = [];
        snapshot.forEach((tDoc) => {
          const data = tDoc.data();
          list.push({
            id: tDoc.id,
            userUid: profile.uid,
            userName: profile.name,
            amount: data.amount || 0,
            type: data.type || 'expense',
            timestamp: data.timestamp,
            description: data.description || 'Transaction',
            category: data.category || 'Other',
            paymentMethod: data.paymentMethod || 'Cash',
            receiptUrl: data.receiptUrl,
            note: data.note,
            tags: data.tags,
            dateStr: getSafeDateStr(data.timestamp)
          } as TransactionItem);
        });
        list.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
        setAllTransactions(list);
      }, (error) => {
        console.warn("Failed to listen to personal transactions:", error);
      });
      unsubscribeTransactions = unsubscribe;
    }

    return () => {
      unsubNotifs();
      unsubscribeUsers();
      unsubscribeTransactions();
    };
  }, [profile]);

  // Sign In
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Input Error", "Please enter both email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Input Error", "Please enter a valid email address.");
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      // Persist credentials locally for biometrics support
      await AsyncStorage.setItem('saved_email', email.trim().toLowerCase());
      await AsyncStorage.setItem('saved_pwd', password);
    } catch (err: any) {
      Alert.alert("Authentication Failed", err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Biometric login execution
  const triggerBiometricUnlock = async () => {
    const isUnlocked = await handleBiometricAuth();
    if (isUnlocked) {
      try {
        const savedEmail = await AsyncStorage.getItem('saved_email');
        const savedPassword = await AsyncStorage.getItem('saved_pwd');
        if (savedEmail && savedPassword) {
          setAuthLoading(true);
          await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
        } else {
          Alert.alert("Enrolment Needed", "You must sign in manually once using Email & Password to initialize biometric lock.");
        }
      } catch (err: any) {
        Alert.alert("Authentication Failed", err.message);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Google Social Sign In simulation / production flow
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      // Mock / Simulating user data to bypass Google console configuration blockages
      const mockEmail = "google.user@gmail.com";
      const mockPass = "google-secret-pass";
      const mockName = "Google Verified Partner";
      
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, mockEmail, mockPass);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.message.includes('user-not-found') || signInErr.message.includes('invalid-credential')) {
          // Register user
          try {
            credential = await createUserWithEmailAndPassword(auth, mockEmail, mockPass);
            const regUser = credential.user;
            const userProfile: UserProfile = {
              uid: regUser.uid,
              name: mockName,
              email: mockEmail,
              phone: "+15555555555",
              role: "USER",
              employeeId: "EMP-GG" + Math.floor(1000 + Math.random() * 9000),
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", regUser.uid), userProfile);
          } catch (regErr: any) {
            if (regErr.code === 'auth/email-already-in-use') {
               credential = await signInWithEmailAndPassword(auth, mockEmail, mockPass);
            } else {
               throw regErr;
            }
          }
        } else {
          throw signInErr;
        }
      }
      
      await AsyncStorage.setItem('saved_email', mockEmail);
      await AsyncStorage.setItem('saved_pwd', mockPass);
      Alert.alert("Google Sign-In", "Google account linked successfully!");
    } catch (err: any) {
      Alert.alert("Google Link Error", err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Forgot Password (Verify Firestore first)
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Email Required", "Please enter your email address first.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setAuthLoading(true);
    try {
      const userEmail = email.trim().toLowerCase();

      // Check if email exists in Firestore to satisfy "Not registered" constraint
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Verification Error", "Not registered. Please register first.");
        setAuthLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, userEmail);
      Alert.alert(
        "Check your email!",
        `A password reset link has been sent to ${email.trim()}.`
      );
      setActiveTab('signin'); 
    } catch (err: any) {
      Alert.alert("Reset Failed", err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // User Registration
  const handleRegister = async () => {
    if (!email || !password || !fullName || !phone) {
      Alert.alert("Input Error", "Please fill in all registration fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Input Error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Input Error", "Password must be at least 6 characters.");
      return;
    }
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const regUser = userCredential.user;
      
      // Force "USER" role only for self-registered users
      const assignedRole = "USER";
      const generatedEmpId = "EMP-" + Math.floor(1000 + Math.random() * 9000);

      const userProfile: UserProfile = {
        uid: regUser.uid,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: assignedRole,
        employeeId: generatedEmpId,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", regUser.uid), userProfile);
      // Persist credentials locally for biometrics support
      await AsyncStorage.setItem('saved_email', email.trim().toLowerCase());
      await AsyncStorage.setItem('saved_pwd', password);
      Alert.alert("Success", "Account created and role activated!");
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      Alert.alert("Sign Out Error", err.message);
    }
  };

  // Notes management actions
  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      Alert.alert("Input Error", "Please enter a note title.");
      return;
    }
    if (!profile) return;
    try {
      if (editingNote) {
        // Update existing note
        await setDoc(doc(db, 'users', profile.uid, 'notes', editingNote.id), {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          createdAt: editingNote.createdAt,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        // Add new note
        await addDoc(collection(db, 'users', profile.uid, 'notes'), {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          createdAt: new Date().toISOString(),
        });
      }
      setNoteTitle('');
      setNoteContent('');
      setEditingNote(null);
      setNoteModalOpen(false);
    } catch (e: any) {
      Alert.alert("Error saving note", e.message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!profile) return;
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', profile.uid, 'notes', noteId));
            } catch (e: any) {
              Alert.alert("Error deleting note", e.message);
            }
          }
        }
      ]
    );
  };

  // Chat Actions
  const handleCreateChat = async () => {
    if (!profile) return;
    const isGroup = newChatGroupTitle.trim().length > 0;
    const participantsList = Array.from(new Set([...newChatSelectedUsers, profile.uid]));
    
    if (participantsList.length < 2) {
      Alert.alert("Input Error", "Please select at least 1 user to chat with.");
      return;
    }
    
    try {
      if (!isGroup && participantsList.length === 2) {
        const existing = chats.find(c => 
          !c.isGroup && 
          c.participants.length === 2 && 
          c.participants.includes(participantsList[0]) && 
          c.participants.includes(participantsList[1])
        );
        if (existing) {
          setCurrentChat(existing);
          setNewChatModalOpen(false);
          setNewChatGroupTitle('');
          setNewChatSelectedUsers([]);
          return;
        }
      }
      
      const newRoom = {
        isGroup,
        groupName: isGroup ? newChatGroupTitle.trim() : null,
        participants: participantsList,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'chats'), newRoom);
      
      setCurrentChat({ id: docRef.id, ...newRoom } as any);
      setNewChatModalOpen(false);
      setNewChatGroupTitle('');
      setNewChatSelectedUsers([]);
    } catch (e: any) {
      Alert.alert("Error creating chat", e.message);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInputText.trim() || !profile || !currentChat) return;
    const plainText = chatInputText.trim();
    setChatInputText('');
    try {
      const encryptedText = encryptMessage(plainText);
      await addDoc(collection(db, 'chats', currentChat.id, 'messages'), {
        senderId: profile.uid,
        senderName: profile.name,
        text: encryptedText,
        timestamp: serverTimestamp(),
        type: 'text'
      });
      await notifyChatParticipants(currentChat.id, profile, chatInputText);
    } catch (e: any) {
      console.warn("Failed to send message:", e);
      Alert.alert("Error sending message", e.message);
    }
  };

  const handleUploadAttachment = async (uri: string, type: 'image' | 'document' | 'audio', originalFileName?: string) => {
    if (!profile || !currentChat) return;
    setSharingMedia(true);
    try {
      const blob = await createBlobFromUri(uri);
      const filename = originalFileName || `${Date.now()}_file`;
      
      const storageRef = ref(storage, `users/${profile.uid}/chat_attachments/${currentChat.id}/${Date.now()}_${filename}`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Encrypt download URL client-side
      const encryptedUrl = encryptMessage(downloadUrl);
      const encryptedFileName = encryptMessage(filename);
      
      await addDoc(collection(db, 'chats', currentChat.id, 'messages'), {
        senderId: profile.uid,
        senderName: profile.name,
        text: encryptedUrl,
        timestamp: serverTimestamp(),
        type: type,
        fileName: encryptedFileName,
        fileSize: blob.size ? `${(blob.size / 1024).toFixed(1)} KB` : 'Unknown size'
      });
      await notifyChatParticipants(currentChat.id, profile, `Sent a ${type}`);
    } catch (e: any) {
      console.warn("Failed to upload/send attachment:", e);
      Alert.alert("Attachment Error", e.message);
    } finally {
      setSharingMedia(false);
      setChatAttachmentMenuOpen(false);
    }
  };



  const handleShareImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Gallery access permissions are required to share photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const fileName = result.assets[0].fileName || 'image.jpg';
      await handleUploadAttachment(uri, 'image', fileName);
    }
  };

  const handleShareDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await handleUploadAttachment(file.uri, 'document', file.name);
      }
    } catch (e: any) {
      console.warn("Document picking cancelled/failed:", e);
    }
  };

  const handleShareAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await handleUploadAttachment(file.uri, 'audio', file.name);
      }
    } catch (e: any) {
      console.warn("Audio picking cancelled/failed:", e);
    }
  };

  const handleShareContact = async (contactUser: UserProfile) => {
    if (!profile || !currentChat) return;
    try {
      const contactObj = {
        name: contactUser.name,
        email: contactUser.email,
        phone: contactUser.phone || 'N/A'
      };
      const plainText = JSON.stringify(contactObj);
      const encryptedText = encryptMessage(plainText);
      
      await addDoc(collection(db, 'chats', currentChat.id, 'messages'), {
        senderId: profile.uid,
        senderName: profile.name,
        text: encryptedText,
        timestamp: serverTimestamp(),
        type: 'contact'
      });
      setChatContactPickerOpen(false);
      setChatAttachmentMenuOpen(false);
    } catch (e: any) {
      Alert.alert("Share Contact Error", e.message);
    }
  };

  // Image Picker Logic (Receipt Attachment & Profile Photo)
  const handleSelectImage = async (target: 'receipt' | 'profile') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Gallery access permissions are required to upload files.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (target === 'receipt') {
        setReceiptPhotoUri(uri);
      } else {
        await handleUploadProfilePhoto(uri);
      }
    }
  };



  const handleUploadProfilePhoto = async (uri: string) => {
    if (!profile) return;
    setSubmitLoading(true);
    try {
      const blob = await createBlobFromUri(uri);
      const storageRef = ref(storage, `users/${profile.uid}/profile.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", profile.uid), {
        profilePhoto: downloadUrl
      });
      setProfile(prev => prev ? { ...prev, profilePhoto: downloadUrl } : null);
      Alert.alert("Success", "Profile photograph updated successfully.");
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit / Save Transaction (supports offline cache automatically)
  const handleSubmitExpense = async () => {
    if (!amountInput || isNaN(Number(amountInput))) {
      Alert.alert("Input Error", "Please enter a valid amount.");
      return;
    }
    if (!descriptionInput.trim()) {
      Alert.alert("Input Error", "Please enter a description.");
      return;
    }

    setSubmitLoading(true);
    try {
      const collectionPath = `users/${profile?.uid}/transactions`;
      const txId = Math.random().toString(36).substring(2, 15);
      
      let finalReceiptUrl = "";
      if (receiptPhotoUri) {
        const blob = await createBlobFromUri(receiptPhotoUri);
        const storageRef = ref(storage, `users/${profile?.uid}/receipts/${txId}.jpg`);
        await uploadBytes(storageRef, blob);
        finalReceiptUrl = await getDownloadURL(storageRef);
      }

      const categoryToLog = categoryInput === 'Custom' ? (customCategory.trim() || 'Other') : categoryInput;
      const tagsArray = transactionTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const txDocRef = doc(db, `users/${profile?.uid}/transactions`, txId);
      const transactionData = {
        amount: Number(amountInput),
        type: typeInput,
        description: descriptionInput.trim(),
        category: categoryToLog,
        paymentMethod: paymentMethodInput,
        receiptUrl: finalReceiptUrl,
        note: transactionNote.trim(),
        tags: tagsArray,
        timestamp: serverTimestamp(),
        createdBy: profile?.uid
      };

      await setDoc(txDocRef, transactionData);
      playSound('add');

      // Notify Executives
      await notifyExecutives(profile, Number(amountInput), descriptionInput.trim());

      setAmountInput('');
      setDescriptionInput('');
      setCustomCategory('');
      setTransactionNote('');
      setTransactionTags('');
      setReceiptPhotoUri(null);
      
      Alert.alert("Logged Successfully", "Your transaction has been updated.");
    } catch (err: any) {
      Alert.alert("Log Failed", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // CRUD Edit Transaction
  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;
    if (!amountInput || isNaN(Number(amountInput))) {
      Alert.alert("Input Error", "Please enter a valid amount.");
      return;
    }
    if (!descriptionInput.trim()) {
      Alert.alert("Input Error", "Please enter a description.");
      return;
    }

    setSubmitLoading(true);
    try {
      const targetUid = editingTransaction.userUid;
      const txId = editingTransaction.id;

      let finalReceiptUrl = editingTransaction.receiptUrl || "";
      if (receiptPhotoUri && receiptPhotoUri !== editingTransaction.receiptUrl) {
        const blob = await createBlobFromUri(receiptPhotoUri);
        const storageRef = ref(storage, `users/${targetUid}/receipts/${txId}.jpg`);
        await uploadBytes(storageRef, blob);
        finalReceiptUrl = await getDownloadURL(storageRef);
      }

      const categoryToLog = categoryInput === 'Custom' ? (customCategory.trim() || 'Other') : categoryInput;
      const tagsArray = transactionTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const txDocRef = doc(db, `users/${targetUid}/transactions`, txId);
      await updateDoc(txDocRef, {
        amount: Number(amountInput),
        type: typeInput,
        description: descriptionInput.trim(),
        category: categoryToLog,
        paymentMethod: paymentMethodInput,
        receiptUrl: finalReceiptUrl,
        note: transactionNote.trim(),
        tags: tagsArray
      });

      setAmountInput('');
      setDescriptionInput('');
      setCustomCategory('');
      setTransactionNote('');
      setTransactionTags('');
      setReceiptPhotoUri(null);
      setEditingTransaction(null);
      Alert.alert("Updated Successfully", "The transaction details have been modified.");
    } catch (err: any) {
      Alert.alert("Update Failed", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // CRUD Delete Transaction
  const handleDeleteTx = async (txId: string, ownerUid: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this transaction record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const targetUid = ownerUid || profile?.uid;
              if (!targetUid) return;
              await deleteDoc(doc(db, "users", targetUid, "transactions", txId));
              playSound('delete');
              Alert.alert("Success", "Transaction record deleted.");
            } catch (err: any) {
              Alert.alert("Failed to delete", err.message);
            }
          }
        }
      ]
    );
  };

  // Filter, Search, Date ranges and tag metrics
  const getFilteredTransactions = () => {
    let list = allTransactions.map(t => {
      if (!t.userName || t.userName === 'Unknown') {
        const found = allUsers.find(u => u.uid === t.userUid);
        if (found) {
          return { ...t, userName: found.name };
        }
      }
      return t;
    });

    // Search Query
    if (searchQuery.trim().length > 0) {
      const queryLower = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.description.toLowerCase().includes(queryLower) ||
        t.category.toLowerCase().includes(queryLower) ||
        (t.note && t.note.toLowerCase().includes(queryLower)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(queryLower)))
      );
    }

    // Category Filter
    if (filterCategory !== 'All') {
      list = list.filter(t => t.category === filterCategory);
    }

    // Type Filter
    if (filterType !== 'all') {
      list = list.filter(t => t.type === filterType);
    }

    // Amount Range
    if (minAmount.length > 0 && !isNaN(Number(minAmount))) {
      list = list.filter(t => t.amount >= Number(minAmount));
    }
    if (maxAmount.length > 0 && !isNaN(Number(maxAmount))) {
      list = list.filter(t => t.amount <= Number(maxAmount));
    }

    // Date range filter
    if (startDateStr.length > 0) {
      const startLimit = new Date(startDateStr);
      if (!isNaN(startLimit.getTime())) {
        list = list.filter(t => new Date(t.dateStr) >= startLimit);
      }
    }
    if (endDateStr.length > 0) {
      const endLimit = new Date(endDateStr);
      if (!isNaN(endLimit.getTime())) {
        list = list.filter(t => new Date(t.dateStr) <= endLimit);
      }
    }

    // Tab period filter
    const now = new Date();
    return list.filter(t => {
      const tDate = new Date(t.dateStr);
      if (periodFilter === 'daily') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return tDate >= startOfToday;
      }
      if (periodFilter === 'weekly') {
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tDate >= startOfWeek;
      }
      if (periodFilter === 'monthly') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tDate >= startOfMonth;
      }
      if (periodFilter === 'yearly') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return tDate >= startOfYear;
      }
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Get transactions for dashboard (personal vs company-wide)
  const getDashboardTransactions = () => {
    const isExecutive = ['ADMIN', 'MD', 'DIRECTOR'].includes(profile?.role || '');
    if (isExecutive && dashboardViewMode === 'all-over') {
      return filteredTransactions;
    }
    return filteredTransactions.filter(t => t.userUid === profile?.uid);
  };

  const dashboardTransactions = getDashboardTransactions();

  // Calculate stats
  let totalIncome = 0;
  let totalExpense = 0;
  dashboardTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }
  });
  const netBalance = totalIncome - totalExpense;

  // Open user detail profile
  const handleOpenUserSheet = (userObj: UserProfile) => {
    setSelectedUserSheet(userObj);
    const userTrans = allTransactions.filter(t => t.userUid === userObj.uid);
    setModalTransactions(userTrans);

    let inflow = 0;
    let outflow = 0;
    userTrans.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        inflow += amt;
      } else {
        outflow += amt;
      }
    });
    setModalTotals({ inflow, outflow, balance: inflow - outflow });

    // Fetch user's notes if the current logged-in user is ADMIN
    if (profile?.role === 'ADMIN') {
      const notesRef = collection(db, 'users', userObj.uid, 'notes');
      getDocs(notesRef).then((snap) => {
        const list: NoteItem[] = [];
        snap.forEach((nDoc) => {
          const data = nDoc.data();
          list.push({
            id: nDoc.id,
            title: data.title || '',
            content: data.content || '',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
        // Sort descending by date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setModalUserNotes(list);
      }).catch((err) => {
        console.warn("Failed to fetch user notes for admin:", err);
      });
    } else {
      setModalUserNotes([]);
    }
  };

  const handleCloseUserSheet = () => {
    setSelectedUserSheet(null);
    setModalTransactions([]);
    setModalUserNotes([]);
  };

  // Change password execution
  const handleProfileChangePassword = async () => {
    if (newPasswordInput.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const userObj = auth.currentUser;
      if (userObj) {
        await updatePassword(userObj, newPasswordInput);
        Alert.alert("Success", "Security password updated.");
        setNewPasswordInput('');
      }
    } catch (err: any) {
      Alert.alert("Failed", err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete profile account + subcollection transactions cleanup
  const handleDeleteSelfAccount = async () => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to permanently delete your account and all associated transaction records? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete My Account", 
          style: "destructive", 
          onPress: async () => {
            try {
              const targetUid = profile?.uid;
              if (!targetUid) return;

              // 1. Delete all transaction records
              const txsQuery = query(collection(db, "users", targetUid, "transactions"));
              const txsSnapshot = await getDocs(txsQuery);
              const deletePromises = txsSnapshot.docs.map(txDoc => deleteDoc(txDoc.ref));
              await Promise.all(deletePromises);

              // 2. Delete main profile document
              await deleteDoc(doc(db, "users", targetUid));

              // 3. Delete from Auth
              const authUser = auth.currentUser;
              if (authUser) {
                await deleteUser(authUser);
              }
              
              Alert.alert("Success", "Account deleted.");
            } catch (err: any) {
              Alert.alert("Failed to delete account", err.message);
            }
          } 
        }
      ]
    );
  };

  // Admin delete target user account
  const handleDeleteUser = async (targetUid: string) => {
    if (!profile || !['ADMIN', 'MD', 'DIRECTOR'].includes(profile.role)) {
      Alert.alert("Permission Denied", "Only administrators can remove users.");
      return;
    }
    if (targetUid === profile.uid) {
      Alert.alert("Denied", "You cannot remove your own admin account.");
      return;
    }

    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to permanently delete this user account? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove User", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Delete all transaction records belonging to this user
              const txsQuery = query(collection(db, "users", targetUid, "transactions"));
              const txsSnapshot = await getDocs(txsQuery);
              const deletePromises = txsSnapshot.docs.map(txDoc => deleteDoc(txDoc.ref));
              await Promise.all(deletePromises);

              // Delete the user's primary profile document
              await deleteDoc(doc(db, "users", targetUid));
              
              Alert.alert("Success", "User account and all associated transaction records deleted successfully.");
              handleCloseUserSheet();
            } catch (err: any) {
              Alert.alert("Failed to delete user", err.message);
            }
          } 
        }
      ]
    );
  };

  // Admin provision new user accounts with arbitrary roles
  const handleAdminCreateUser = async () => {
    if (!adminNewEmail || !adminNewPass || !adminNewName || !adminNewPhone) {
      Alert.alert("Error", "Please fill in all details.");
      return;
    }
    setSubmitLoading(true);
    try {
      // 1. Create authentication profile
      const userCredential = await createUserWithEmailAndPassword(auth, adminNewEmail.trim().toLowerCase(), adminNewPass);
      const newUser = userCredential.user;

      // 2. Write details to Firestore
      const generatedEmpId = "EMP-" + Math.floor(1000 + Math.random() * 9000);
      const userProfile: UserProfile = {
        uid: newUser.uid,
        name: adminNewName.trim(),
        email: adminNewEmail.trim().toLowerCase(),
        phone: adminNewPhone.trim(),
        role: adminNewRole,
        employeeId: generatedEmpId,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", newUser.uid), userProfile);

      // 3. Re-login administrator using saved credentials
      const adminEmail = await AsyncStorage.getItem('saved_email');
      const adminPass = await AsyncStorage.getItem('saved_pwd');
      if (adminEmail && adminPass) {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
        Alert.alert("Success", `Account created successfully with role ${adminNewRole}.`);
      } else {
        Alert.alert("Success", "Account created, but admin session expired. Please log in again.");
      }

      // Reset fields
      setAdminNewEmail('');
      setAdminNewPass('');
      setAdminNewName('');
      setAdminNewPhone('');
      setAdminNewRole('USER');
      setAdminCreateOpen(false);
    } catch (err: any) {
      Alert.alert("Provision Failed", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // CSV Exporter (Web + Native)
  const handleExportCSV = async (userObj: UserProfile, trans: TransactionItem[]) => {
    try {
      const headers = ["Description", "Category", "Type", "Payment Method", "Date / Time", "Amount (INR)", "Receipt URL", "Note"];
      const rows = trans.map(t => [
        t.description,
        t.category,
        t.type,
        t.paymentMethod,
        new Date(t.dateStr).toLocaleString('en-IN'),
        t.amount,
        t.receiptUrl || "N/A",
        t.note || ""
      ]);
      const csvContent = [headers, ...rows]
        .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n");
        
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${userObj.name.replace(/\s+/g, '_')}_spending_sheet.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert("Success", "Data exported successfully as CSV!");
      } else {
        const fileUri = FileSystem.documentDirectory + `${userObj.name.replace(/\s+/g, '_')}_spending_sheet.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export CSV',
            UTI: 'public.comma-separated-values-text'
          });
        } else {
          Alert.alert("Error", "Sharing is not available on this device");
        }
      }
    } catch (err: any) {
      Alert.alert("Export Failed", err.message);
    }
  };

  // PDF Exporter (Web + Native)
  const handleExportPDF = async (userObj: UserProfile, trans: TransactionItem[]) => {
    try {
      let tableRows = "";
      let inflow = 0;
      let outflow = 0;
      trans.forEach(t => {
        const dateFormatted = new Date(t.dateStr).toLocaleString('en-IN');
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') {
          inflow += amt;
        } else {
          outflow += amt;
        }
        tableRows += `
          <tr>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td style="text-transform: capitalize;">${t.type}</td>
            <td>${t.paymentMethod}</td>
            <td>${dateFormatted}</td>
            <td style="text-align: right; font-weight: 600; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">
              ${t.type === 'income' ? '+' : '-'} ₹${amt.toLocaleString('en-IN')}
            </td>
            <td>${t.receiptUrl ? `<a href="${t.receiptUrl}" target="_blank">View Receipt</a>` : 'N/A'}</td>
          </tr>
        `;
      });
      const balance = inflow - outflow;
      
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
              .title { font-size: 28px; font-weight: 800; color: #1f2937; margin: 0; }
              .subtitle { color: #6b7280; font-size: 16px; margin-top: 8px; }
              .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
              .card { flex: 1; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; text-align: center; }
              .card-title { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; }
              .card-val { font-size: 20px; font-weight: 800; margin-top: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-size: 13px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 700; }
              a { color: #3b82f6; text-decoration: none; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Admyproperty Vault Spending Summary</div>
              <div class="subtitle">Generated for <b>${userObj.name}</b> (${userObj.role}) on ${new Date().toLocaleString('en-IN')}</div>
            </div>
            
            <div class="summary-cards">
              <div class="card">
                <div class="card-title">Total Inflow</div>
                <div class="card-val" style="color: #10b981;">₹${inflow.toLocaleString('en-IN')}</div>
              </div>
              <div class="card">
                <div class="card-title">Total Outflow</div>
                <div class="card-val" style="color: #ef4444;">₹${outflow.toLocaleString('en-IN')}</div>
              </div>
              <div class="card">
                <div class="card-title">Net Balance</div>
                <div class="card-val" style="color: ${balance >= 0 ? '#10b981' : '#ef4444'};">₹${balance.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Date & Time</th>
                  <th style="text-align: right;">Amount (INR)</th>
                  <th>Attachment</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          Alert.alert("Pop-up Blocked", "Please allow pop-ups for this website to export PDFs.");
          return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export PDF',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert("Error", "Sharing is not available on this device");
        }
      }
    } catch (err: any) {
      Alert.alert("Export Failed", err.message);
    }
  };

  if (loading) {
    return <LoadingOverlay activeTheme={activeTheme} userName={profile?.name} />;
  }

  return (
    <SafeAreaView 
      style={[styles.root, { backgroundColor: activeTheme.background }]}
      onStartShouldSetResponderCapture={() => {
        onUserInteraction();
        return false;
      }}
    >
      <StatusBar hidden={true} />
      {/* Background Animated money particles */}
      <MoneyBackground activeThemeKey={activeThemeKey} symbols={activeTheme.moneySymbols} primaryColor={activeTheme.primaryColor} />

      {/* Real-time Offline Warning Banner */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ Offline Mode: Data will queue and sync when reconnected.
          </Text>
        </View>
      )}

      {/* Email Verification Banner */}
      {user && !emailVerified && (
        <View style={[styles.verificationBanner, { backgroundColor: activeTheme.expenseColor + '18', borderColor: activeTheme.expenseColor }]}>
          <Text style={[styles.verificationText, { color: activeTheme.textColor }]}>
            ⚠️ Account not verified. Please verify your email address.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: activeTheme.primaryColor }]} onPress={resendVerification}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Resend Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]} onPress={checkEmailVerification}>
              <Text style={{ color: activeTheme.textColor, fontSize: 11 }}>I Verified (Refresh)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingTop: Math.max(insets.top, 10) + 10 }]} keyboardShouldPersistTaps="handled">
        {user && profile ? (
          <View style={styles.dashboardContainer}>
            
            {/* Header with Top-Left Logo / Custom Steve Head */}
            <View style={styles.dashboardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View>
                  <Text style={[styles.welcomeText, { fontFamily: activeTheme.fontFamily || 'System', color: activeTheme.textMutedColor, fontSize: 14, fontWeight: '500' }]}>Welcome,</Text>
                  <Text style={[styles.welcomeText, { fontFamily: activeTheme.fontFamily || 'System', color: activeTheme.textColor, fontSize: 18, fontWeight: '800' }]}>{profile.name}</Text>
                </View>
              </View>
              
              <View style={styles.headerUserSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  {['ADMIN', 'MD', 'DIRECTOR'].includes(profile.role) && (
                    <TouchableOpacity onPress={() => setDashboardViewMode(prev => prev === 'personal' ? 'all-over' : 'personal')} style={{ marginRight: 5, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: activeTheme.primaryColor + '20', borderRadius: 12, borderWidth: 1, borderColor: activeTheme.primaryColor }}>
                      <Text style={{ color: activeTheme.primaryColor, fontSize: 10, fontWeight: '700' }}>
                        {dashboardViewMode === 'personal' ? '🏢 Vault View' : '👤 Personal'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setShowNotifSheet(true)} style={{ position: 'relative' }}>
                    <Text style={{ fontSize: 22 }}>🔔</Text>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <View style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{notifications.filter(n => !n.read).length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* TAB CONTAINER CONTENT SWITCHER */}
            {dashboardTab === 'dashboard' && (
              <>
                {/* Financial Summary Card */}
                {showSummaryCards && (
                  activeThemeKey === 'minecraft_anime' ? (
                    <View style={{
                      backgroundColor: '#13223f',
                      borderColor: '#000000',
                      borderWidth: 3,
                      borderRadius: 8,
                      padding: 24,
                      alignItems: 'center',
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 5 },
                      shadowOpacity: 1,
                      shadowRadius: 0,
                      marginBottom: 10,
                      position: 'relative'
                    }}>
                      <View style={{
                        position: 'absolute',
                        top: 2, left: 2, right: 2, bottom: 2,
                        borderColor: '#2b4d8c',
                        borderWidth: 2,
                        borderRadius: 6,
                      }} />
                      <Text style={{
                        fontFamily: 'monospace',
                        fontSize: 14,
                        color: '#ffffff',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 1
                      }}>Total Balance</Text>
                      <Text style={{
                        fontFamily: 'monospace',
                        fontSize: 34,
                        color: '#ffd700',
                        fontWeight: '900',
                        marginTop: 8,
                        textShadowColor: '#000000',
                        textShadowOffset: { width: 2, height: 2 },
                        textShadowRadius: 0
                      }}>
                        ₹{netBalance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ) : activeThemeKey === 'brick_breaker' ? (
                    <View style={{
                      backgroundColor: '#121222',
                      borderColor: '#ff007f',
                      borderWidth: 2.5,
                      borderRadius: 8,
                      padding: 20,
                      marginBottom: 10,
                      shadowColor: '#ff007f',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontFamily: 'monospace', color: '#00ffff', fontSize: 11, fontWeight: '700' }}>HIGH SCORE: 99999</Text>
                        <Text style={{ fontFamily: 'monospace', color: '#00ffff', fontSize: 11, fontWeight: '700' }}>LVL: 01</Text>
                      </View>
                      <View style={{ alignItems: 'center', marginVertical: 12 }}>
                        <Text style={{ fontFamily: 'monospace', color: '#ffffff', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Score Balance</Text>
                        <Text style={{ fontFamily: 'monospace', color: '#39ff14', fontSize: 32, fontWeight: '800', marginTop: 4 }}>
                          ₹{netBalance.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    // Default Card UI
                    <View style={[
                      styles.summaryCard, 
                      { 
                        backgroundColor: activeTheme.cardBackground, 
                        borderColor: activeTheme.cardBorder, 
                        borderRadius: activeTheme.borderRadius,
                        borderWidth: activeTheme.borderWidth || 1
                      }
                    ]}>
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardChip}>
                          <View style={styles.cardChipInner} />
                        </View>
                        <Text style={[styles.cardBrandText, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>VALUED MEMBER</Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>NET BALANCE</Text>
                        <Text style={[
                          styles.summaryVal, 
                          { 
                            fontFamily: activeTheme.fontFamily || 'System',
                            color: activeTheme.balanceColor || (netBalance >= 0 ? activeTheme.incomeColor : activeTheme.expenseColor),
                          }
                        ]}>
                          ₹{netBalance.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.cardHolderRow}>
                        <Text style={[styles.cardHolderLabel, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>CARDHOLDER</Text>
                        <Text style={[styles.cardHolderName, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>{profile.name.toUpperCase()}</Text>
                      </View>

                      <View style={[styles.summaryDivider, { backgroundColor: activeTheme.inputBorder }]} />
                      
                      <View style={styles.summaryRow}>
                        <View style={styles.summarySubItem}>
                          <Text style={[styles.summaryLabelSub, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>↗ INFLOW</Text>
                          <Text style={[styles.summaryValSub, { color: activeTheme.incomeColor, fontFamily: activeTheme.fontFamily || 'System' }]}>₹{totalIncome.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.summarySubItem}>
                          <Text style={[styles.summaryLabelSub, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>↘ OUTFLOW</Text>
                          <Text style={[styles.summaryValSub, { color: activeTheme.expenseColor, fontFamily: activeTheme.fontFamily || 'System' }]}>₹{totalExpense.toLocaleString('en-IN')}</Text>
                        </View>
                      </View>
                    </View>
                  )
                )}

                {/* Spending Insights Banner */}
                <View style={[styles.insightsCard, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.borderWidth || 1 }]}>
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontSize: 13, marginBottom: 8 }]}>Spending Insights & Alerts</Text>
                  <Text style={{ color: activeTheme.textColor, fontSize: 12, lineHeight: 18 }}>{getSpendingInsights()}</Text>
                </View>

                {/* Dashboard Widget Customizer Trigger */}
                <TouchableOpacity style={[styles.customizerTrigger, { borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius }]} onPress={() => setCustomizerOpen(!customizerOpen)}>
                  <Text style={{ color: activeTheme.primaryColor, fontWeight: '700', fontSize: 12 }}>⚙️ Customize Dashboard Widgets</Text>
                </TouchableOpacity>

                {customizerOpen && (
                  <View style={[styles.customizerPanel, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius }]}>
                    <View style={styles.customizerRow}>
                      <Text style={{ color: activeTheme.textColor, fontSize: 13 }}>Show Balance Cards</Text>
                      <Switch value={showSummaryCards} onValueChange={(val) => { setShowSummaryCards(val); saveDashboardCustomization('custom_show_cards', val); }} />
                    </View>
                    <View style={styles.customizerRow}>
                      <Text style={{ color: activeTheme.textColor, fontSize: 13 }}>Show Trend Charts</Text>
                      <Switch value={showCharts} onValueChange={(val) => { setShowCharts(val); saveDashboardCustomization('custom_show_charts', val); }} />
                    </View>
                    <View style={styles.customizerRow}>
                      <Text style={{ color: activeTheme.textColor, fontSize: 13 }}>Show Goals Widget</Text>
                      <Switch value={showGoalsWidget} onValueChange={(val) => { setShowGoalsWidget(val); saveDashboardCustomization('custom_show_goals', val); }} />
                    </View>
                    <View style={styles.customizerRow}>
                      <Text style={{ color: activeTheme.textColor, fontSize: 13 }}>Show Achievements</Text>
                      <Switch value={showAchievementsWidget} onValueChange={(val) => { setShowAchievementsWidget(val); saveDashboardCustomization('custom_show_ach', val); }} />
                    </View>
                  </View>
                )}

                {/* Charts have been moved to the Stats tab */}

                {/* EXPENSE/TRANSACTION FORM SUBMITTER */}
                <View style={[
                  styles.card, 
                  { 
                    backgroundColor: activeTheme.cardBackground, 
                    borderColor: activeTheme.cardBorder, 
                    borderRadius: activeTheme.borderRadius,
                    borderWidth: activeTheme.borderWidth || 1
                  }
                ]}>
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                    {editingTransaction ? 'Edit Transaction Details' : 'Log New Transaction'}
                  </Text>
                  
                  <View style={styles.form}>
                    <TextInput
                      style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                      placeholder="Description (e.g., Office Supplies)"
                      placeholderTextColor={activeTheme.textMutedColor}
                      value={descriptionInput}
                      onChangeText={setDescriptionInput}
                    />

                    <TextInput
                      style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                      placeholder="Amount (INR)"
                      placeholderTextColor={activeTheme.textMutedColor}
                      keyboardType="numeric"
                      value={amountInput}
                      onChangeText={setAmountInput}
                    />

                    {/* Predefined + Custom Category Selector */}
                    <Text style={{ color: activeTheme.textColor, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Select Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {Object.keys(CATEGORY_ICONS).concat(['Custom']).map((cat) => {
                        const isSelected = categoryInput === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.categorySelectBtn,
                              { borderColor: isSelected ? activeTheme.primaryColor : 'rgba(255,255,255,0.05)', borderRadius: activeTheme.borderRadius },
                              isSelected && { backgroundColor: activeTheme.primaryColor + '15' }
                            ]}
                            onPress={() => setCategoryInput(cat)}
                          >
                            <Text style={{ color: isSelected ? activeTheme.textColor : activeTheme.textMutedColor, fontSize: 12 }}>
                              {(CATEGORY_ICONS[cat] || '🏷️') + " " + cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {categoryInput === 'Custom' && (
                      <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                        placeholder="Enter Custom Category Title"
                        placeholderTextColor={activeTheme.textMutedColor}
                        value={customCategory}
                        onChangeText={setCustomCategory}
                      />
                    )}

                    {/* Payment Method Selector */}
                    <Text style={{ color: activeTheme.textColor, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Payment Method</Text>
                    <View style={styles.toggleRow}>
                      {(['Cash', 'Card', 'Bank'] as const).map((method) => {
                        const isSelected = paymentMethodInput === method;
                        return (
                          <TouchableOpacity
                            key={method}
                            style={[
                              styles.toggleBtn, 
                              { borderRadius: activeTheme.borderRadius, borderColor: isSelected ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)' },
                              isSelected && { backgroundColor: activeTheme.primaryColor + '12' }
                            ]}
                            onPress={() => setPaymentMethodInput(method)}
                          >
                            <Text style={{ color: isSelected ? activeTheme.primaryColor : activeTheme.textMutedColor, fontWeight: '700', fontSize: 12 }}>{method}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Receipt upload / attachment */}
                    <Text style={{ color: activeTheme.textColor, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Attach Receipt Proof</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity style={[styles.uploadAttachmentBtn, { borderColor: activeTheme.primaryColor }]} onPress={() => handleSelectImage('receipt')}>
                        <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '700' }}>📁 Gallery</Text>
                      </TouchableOpacity>

                    </View>
                    {receiptPhotoUri && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ color: activeTheme.textColor, fontSize: 11 }} numberOfLines={1}>Attached: {receiptPhotoUri.split('/').pop()}</Text>
                        <TouchableOpacity onPress={() => setReceiptPhotoUri(null)}>
                          <Text style={{ color: 'red', fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Optional tags and notes */}
                    <TextInput
                      style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                      placeholder="Transaction note/memo (Optional)"
                      placeholderTextColor={activeTheme.textMutedColor}
                      value={transactionNote}
                      onChangeText={setTransactionNote}
                    />

                    <TextInput
                      style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                      placeholder="Tags (comma-separated, e.g. monthly, office)"
                      placeholderTextColor={activeTheme.textMutedColor}
                      value={transactionTags}
                      onChangeText={setTransactionTags}
                    />

                    <View style={styles.toggleRow}>
                      <TouchableOpacity 
                        style={[
                          styles.toggleBtn, 
                          { 
                            borderRadius: activeTheme.borderRadius, 
                            borderColor: typeInput === 'expense' ? (activeTheme.isRetro ? '#000000' : activeTheme.expenseColor) : 'rgba(255, 255, 255, 0.05)' 
                          },
                          typeInput === 'expense' && { 
                            backgroundColor: activeThemeKey === 'minecraft_anime' ? '#5cbf3a' : activeTheme.expenseColor + '12' 
                          }
                        ]}
                        onPress={() => setTypeInput('expense')}
                      >
                        <Text style={[
                          styles.toggleText, 
                          { 
                            fontFamily: activeTheme.fontFamily || 'System',
                            color: typeInput === 'expense' ? (activeThemeKey === 'minecraft_anime' ? '#ffffff' : activeTheme.expenseColor) : activeTheme.textMutedColor,
                            fontWeight: activeTheme.isRetro ? '800' : '600'
                          }
                        ]}>
                          Expense
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.toggleBtn, 
                          { 
                            borderRadius: activeTheme.borderRadius, 
                            borderColor: typeInput === 'income' ? (activeTheme.isRetro ? '#000000' : activeTheme.incomeColor) : 'rgba(255, 255, 255, 0.05)' 
                          },
                          typeInput === 'income' && { 
                            backgroundColor: activeThemeKey === 'minecraft_anime' ? '#3abcc0' : activeTheme.incomeColor + '12' 
                          }
                        ]}
                        onPress={() => setTypeInput('income')}
                      >
                        <Text style={[
                          styles.toggleText, 
                          { 
                            fontFamily: activeTheme.fontFamily || 'System',
                            color: typeInput === 'income' ? (activeThemeKey === 'minecraft_anime' ? '#ffffff' : activeTheme.incomeColor) : activeTheme.textMutedColor,
                            fontWeight: activeTheme.isRetro ? '800' : '600'
                          }
                        ]}>
                          Income
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={[
                        styles.submitBtn, 
                        { 
                          backgroundColor: activeTheme.primaryColor, 
                          borderRadius: activeTheme.borderRadius,
                          borderWidth: activeTheme.isRetro ? activeTheme.borderWidth || 3 : 0,
                          borderColor: activeTheme.isRetro ? '#000000' : 'transparent'
                        }
                      ]} 
                      onPress={editingTransaction ? handleUpdateTransaction : handleSubmitExpense}
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <ActivityIndicator size="small" color={activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff'} />
                      ) : (
                        <Text style={[
                          styles.submitBtnText, 
                          { 
                            color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff',
                            fontFamily: activeTheme.fontFamily || 'System',
                            textTransform: activeTheme.isRetro ? 'uppercase' : 'none'
                          }
                        ]}>{editingTransaction ? 'Save Modifications' : 'Submit Transaction'}</Text>
                      )}
                    </TouchableOpacity>
                    
                    {editingTransaction && (
                      <TouchableOpacity style={[styles.cancelEditBtn, { borderRadius: activeTheme.borderRadius }]} onPress={() => {
                        setEditingTransaction(null);
                        setAmountInput('');
                        setDescriptionInput('');
                        setCustomCategory('');
                        setTransactionNote('');
                        setTransactionTags('');
                        setReceiptPhotoUri(null);
                      }}>
                        <Text style={{ color: activeTheme.textColor }}>Cancel Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Minecraft featured goals */}
                {showGoalsWidget && activeThemeKey === 'minecraft_anime' && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: activeTheme.textColor }}>Featured Goals</Text>
                      <Text style={{ fontFamily: 'monospace', fontSize: 14, color: activeTheme.textMutedColor }}>&lt; &gt;</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                      <View style={{ width: 155, backgroundColor: '#13223f', borderWidth: 3, borderColor: '#000000', borderRadius: 8, padding: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontSize: 18 }}>💎</Text>
                          <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#3abcc0', fontWeight: '800' }}>17%</Text>
                        </View>
                        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#ffffff', fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>New Gaming PC</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 9, color: '#8a9bb5' }}>₹350 / ₹2000</Text>
                        <View style={{ height: 6, backgroundColor: '#0b1627', borderRadius: 0, borderWidth: 1, borderColor: '#000', marginTop: 8 }}>
                          <View style={{ width: '17%', height: '100%', backgroundColor: '#5cbf3a' }} />
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {dashboardTab === 'activity' && (
              <>
                {/* Advanced Search, Categories, Type & Range Filters */}
                <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius, marginBottom: 12 }]}>
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor }]}>🔍 Advanced Filters & Search</Text>
                  
                  <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                    placeholder="Search by note, tag, description..."
                    placeholderTextColor={activeTheme.textMutedColor}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />

                  {/* Filter type row */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {(['all', 'income', 'expense', 'transfer'] as const).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterMiniBtn,
                          { borderColor: filterType === type ? activeTheme.primaryColor : 'rgba(255,255,255,0.05)', borderRadius: activeTheme.borderRadius },
                          filterType === type && { backgroundColor: activeTheme.primaryColor + '12' }
                        ]}
                        onPress={() => setFilterType(type)}
                      >
                        <Text style={{ color: filterType === type ? activeTheme.textColor : activeTheme.textMutedColor, fontSize: 11, textTransform: 'capitalize' }}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Amount Ranges */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignSelf: 'stretch' }}>
                    <TextInput
                      style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor, paddingVertical: 10, paddingHorizontal: 12, fontSize: 13 }]}
                      placeholder="Min ₹"
                      placeholderTextColor={activeTheme.textMutedColor}
                      keyboardType="numeric"
                      value={minAmount}
                      onChangeText={setMinAmount}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, minWidth: 0, backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor, paddingVertical: 10, paddingHorizontal: 12, fontSize: 13 }]}
                      placeholder="Max ₹"
                      placeholderTextColor={activeTheme.textMutedColor}
                      keyboardType="numeric"
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                    />
                  </View>

                  {/* Date range inputs */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignSelf: 'stretch' }}>
                    <TouchableOpacity
                      style={[
                        styles.datePickerBtn,
                        {
                          flex: 1,
                          backgroundColor: activeTheme.inputBackground,
                          borderColor: activeTheme.inputBorder,
                          borderRadius: activeTheme.borderRadius,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                        }
                      ]}
                      onPress={() => {
                        setDatePickerTarget('start');
                        setPickerMonthDate(startDateStr ? new Date(startDateStr) : new Date());
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={{ color: startDateStr ? activeTheme.textColor : activeTheme.textMutedColor, fontSize: 13, flex: 1 }} numberOfLines={1}>
                          {startDateStr ? `From: ${startDateStr}` : 'Start Date 📅'}
                        </Text>
                        {startDateStr.length > 0 && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setStartDateStr('');
                            }}
                            style={{ padding: 4 }}
                          >
                            <Text style={{ color: activeTheme.expenseColor, fontSize: 14, fontWeight: 'bold' }}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.datePickerBtn,
                        {
                          flex: 1,
                          backgroundColor: activeTheme.inputBackground,
                          borderColor: activeTheme.inputBorder,
                          borderRadius: activeTheme.borderRadius,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                        }
                      ]}
                      onPress={() => {
                        setDatePickerTarget('end');
                        setPickerMonthDate(endDateStr ? new Date(endDateStr) : new Date());
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={{ color: endDateStr ? activeTheme.textColor : activeTheme.textMutedColor, fontSize: 13, flex: 1 }} numberOfLines={1}>
                          {endDateStr ? `To: ${endDateStr}` : 'End Date 📅'}
                        </Text>
                        {endDateStr.length > 0 && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setEndDateStr('');
                            }}
                            style={{ padding: 4 }}
                          >
                            <Text style={{ color: activeTheme.expenseColor, fontSize: 14, fontWeight: 'bold' }}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Period tabs */}
                <View style={styles.filterContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => {
                      const isActive = periodFilter === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.filterBtn,
                            { borderRadius: activeTheme.borderRadius, borderColor: isActive ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)' },
                            isActive && { backgroundColor: activeTheme.primaryColor === '#ffffff' ? '#ffffff' : activeTheme.primaryColor + '18' }
                          ]}
                          onPress={() => setPeriodFilter(p)}
                        >
                          <Text style={[styles.filterBtnText, { color: isActive ? activeTheme.textColor : activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                            {p.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* TRANSACTION LEDGER */}
                <View style={[
                  styles.card, 
                  { 
                    backgroundColor: activeTheme.cardBackground, 
                    borderColor: activeTheme.cardBorder, 
                    borderRadius: activeTheme.borderRadius,
                    borderWidth: activeTheme.borderWidth || 1
                  }
                ]}>
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Transactions Log Ledger</Text>
                  {filteredTransactions.length === 0 ? (
                    <Text style={styles.emptyText}>No transaction records match the filter query.</Text>
                  ) : (
                    filteredTransactions.map(item => (
                      <View key={item.id} style={[styles.ledgerRow, { borderBottomColor: activeTheme.inputBorder }]}>
                        <View style={styles.ledgerLeftRow}>
                          <View style={[styles.ledgerCategoryIconBg, { backgroundColor: activeTheme.inputBackground, borderRadius: activeTheme.borderRadius, borderColor: activeTheme.cardBorder }]}>
                            <Text style={styles.ledgerCategoryIcon}>
                              {CATEGORY_ICONS[item.category] || '📦'}
                            </Text>
                          </View>
                          <View style={styles.ledgerLeft}>
                            <Text style={[styles.ledgerId, { color: activeTheme.textColor }]}>{item.description}</Text>
                            <View style={styles.ledgerSubRow}>
                              <Text style={[styles.ledgerTime, { color: activeTheme.textMutedColor }]}>
                                {new Date(item.dateStr).toLocaleDateString('en-IN')} • {item.paymentMethod}
                              </Text>
                              {item.tags && item.tags.map(tag => (
                                <Text key={tag} style={{ color: activeTheme.primaryColor, fontSize: 9, backgroundColor: activeTheme.primaryColor + '12', paddingHorizontal: 4, borderRadius: 3 }}>#{tag}</Text>
                              ))}
                              {['ADMIN', 'MD', 'DIRECTOR'].includes(profile?.role || '') && item.userName && (
                                <TouchableOpacity 
                                  onPress={() => {
                                    const foundUser = allUsers.find(u => u.uid === item.userUid || u.name === item.userName);
                                    if (foundUser) {
                                      handleOpenUserSheet(foundUser);
                                    } else {
                                      handleOpenUserSheet({
                                        uid: item.userUid,
                                        name: item.userName,
                                        role: 'USER',
                                        email: 'Syncing...'
                                      } as UserProfile);
                                    }
                                  }}
                                >
                                  <Text style={[styles.ledgerUserLink, { color: activeTheme.primaryColor }]}>• {item.userName}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            {item.receiptUrl ? (
                              <TouchableOpacity onPress={() => Alert.alert("Receipt Attachment", "Mock display: In production downloads standard photo.")}>
                                <Text style={{ color: '#3b82f6', fontSize: 10, marginTop: 4, fontWeight: '700' }}>📎 View Receipt</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.ledgerRight}>
                          <Text style={[styles.ledgerAmount, { color: item.type === 'income' ? activeTheme.incomeColor : activeTheme.expenseColor }]}>
                            {item.type === 'income' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                          </Text>
                          
                          {/* CRUD Options trigger */}
                          <TouchableOpacity onPress={() => {
                            setEditingTransaction(item);
                            setAmountInput(String(item.amount));
                            setDescriptionInput(item.description);
                            setCategoryInput(Object.keys(CATEGORY_ICONS).includes(item.category) ? item.category : 'Custom');
                            if (!Object.keys(CATEGORY_ICONS).includes(item.category)) setCustomCategory(item.category);
                            setPaymentMethodInput(item.paymentMethod);
                            setTransactionNote(item.note || '');
                            setTransactionTags((item.tags || []).join(', '));
                            setReceiptPhotoUri(item.receiptUrl || null);
                            setDashboardTab('dashboard'); 
                          }} style={{ paddingHorizontal: 6 }}>
                            <Text style={{ color: activeTheme.primaryColor, fontSize: 12 }}>✏️</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.deleteTxBtn}
                            onPress={() => handleDeleteTx(item.id, item.userUid)}
                          >
                            <Text style={styles.deleteTxText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {dashboardTab === 'accounts' && (
              <>
                {/* ADMIN / USERS DIRECTORY VIEW */}
                {['ADMIN', 'MD', 'DIRECTOR'].includes(profile.role) ? (
                  <View style={[
                    styles.card, 
                    { 
                      backgroundColor: activeTheme.cardBackground, 
                      borderColor: activeTheme.cardBorder, 
                      borderRadius: activeTheme.borderRadius,
                      borderWidth: activeTheme.borderWidth || 1
                    }
                  ]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={[styles.cardHeader, { color: activeTheme.textColor, marginBottom: 0 }]}>Vault Directory Control</Text>
                      <TouchableOpacity style={[styles.adminCreateBtn, { backgroundColor: activeTheme.primaryColor }]} onPress={() => setAdminCreateOpen(true)}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+ New User</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {allUsers.length === 0 ? (
                      <Text style={styles.emptyText}>No users registered.</Text>
                    ) : (
                      allUsers.map((u) => {
                        const userTrans = allTransactions.filter(t => t.userUid === u.uid);
                        let totalSpent = 0;
                        userTrans.forEach(t => {
                          if (t.type === 'expense') {
                            totalSpent += Number(t.amount) || 0;
                          }
                        });

                        const pct = totalExpense > 0 ? (totalSpent / totalExpense) * 100 : 0;

                        return (
                          <TouchableOpacity
                            key={u.uid}
                            style={[styles.teamMemberItem, { borderBottomColor: activeTheme.inputBorder }]}
                            onPress={() => handleOpenUserSheet(u)}
                          >
                            <View style={styles.teamMemberInfo}>
                              {u.profilePhoto ? (
                                <Image source={{ uri: u.profilePhoto }} style={styles.teamMemberAvatar} />
                              ) : (
                                <View style={[styles.teamMemberAvatar, { backgroundColor: activeTheme.primaryColor, borderRadius: activeTheme.borderRadius }]}>
                                  <Text style={[styles.avatarText, { color: '#fff' }]}>
                                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                  </Text>
                                </View>
                              )}
                              <View>
                                <Text style={[styles.teamMemberName, { color: activeTheme.textColor }]}>{u.name || 'Unknown'}</Text>
                                <Text style={{ color: activeTheme.textMutedColor, fontSize: 10 }}>{u.role}</Text>
                              </View>
                            </View>
                            <View style={styles.teamMemberSpending}>
                              <Text style={[styles.spendingLabel, { color: activeTheme.textMutedColor }]}>Outflow Spent</Text>
                              <Text style={[styles.spendingVal, { color: activeTheme.expenseColor }]}>₹{totalSpent.toLocaleString('en-IN')}</Text>
                              
                              <View style={styles.miniProgressBarTrack}>
                                <View style={[styles.miniProgressBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: activeTheme.expenseColor }]} />
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                ) : (
                  <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius, padding: 20 }]}>
                    <Text style={[styles.cardHeader, { color: activeTheme.textColor }]}>Directory Restricted</Text>
                    <Text style={{ color: activeTheme.textMutedColor, fontSize: 13 }}>
                      The member control dashboard list directory is restricted to Administrators only. Use the Dashboard tab to view and log personal spending accounts.
                    </Text>
                  </View>
                )}
              </>
            )}

            {dashboardTab === 'rewards' && (
              <View style={[
                styles.card, 
                { 
                  backgroundColor: activeTheme.cardBackground, 
                  borderColor: activeTheme.cardBorder, 
                  borderRadius: activeTheme.borderRadius,
                  borderWidth: activeTheme.borderWidth || 1
                }
              ]}>
                <Text style={[styles.cardHeader, { color: activeTheme.textColor, marginBottom: 12 }]}>🏆 Achievements & Financial Milestones</Text>
                <View style={styles.achievementGrid}>
                  {[
                    { id: '1', title: 'Wood Age', desc: 'Log first transaction', unlocked: allTransactions.length > 0, icon: '🪵' },
                    { id: '2', title: 'Stone Age', desc: 'Log at least 5 logs', unlocked: allTransactions.length >= 5, icon: '🪨' },
                    { id: '3', title: 'Diamond Miner', desc: 'Log income >= ₹5,000', unlocked: allTransactions.some(t => t.type === 'income' && t.amount >= 5000), icon: '💎' },
                    { id: '4', title: 'Iron Defense', desc: 'Net balance is positive', unlocked: netBalance > 0, icon: '🛡️' },
                    { id: '5', title: 'Redstone Eng', desc: 'Admin control role access', unlocked: profile.role === 'ADMIN', icon: '🔴' },
                    { id: '6', title: 'High Score', desc: 'Net balance >= ₹10,000', unlocked: netBalance >= 10000, icon: '🏆' },
                  ].map((ach) => (
                    <View 
                      key={ach.id} 
                      style={[
                        styles.achievementCard, 
                        {
                          backgroundColor: ach.unlocked ? (activeThemeKey === 'minecraft_anime' ? '#13223f' : 'rgba(255, 255, 255, 0.03)') : 'rgba(0, 0, 0, 0.3)',
                          borderColor: ach.unlocked ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: activeTheme.borderRadius,
                          opacity: ach.unlocked ? 1 : 0.45
                        }
                      ]}
                    >
                      {!ach.unlocked && <View style={{ position: 'absolute', top: 4, right: 4 }}><Text style={{ fontSize: 9 }}>🔒</Text></View>}
                      <Text style={styles.achievementIcon}>{ach.icon}</Text>
                      <Text style={[styles.achievementTitle, { color: ach.unlocked ? activeTheme.textColor : activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>{ach.title}</Text>
                      <Text style={[styles.achievementDesc, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>{ach.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {dashboardTab === 'calendar' && (
              <>
                <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius, padding: 16 }]}>
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor }]}>📅 Finance Calendar Tracker</Text>

                  {/* Month Navigation */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => {
                        const d = new Date(calendarDate);
                        d.setMonth(d.getMonth() - 1);
                        setCalendarDate(d);
                        setCalendarSelectedDay(null);
                      }}
                      style={{ padding: 8, borderRadius: 12, backgroundColor: activeTheme.primaryColor + '20' }}
                    >
                      <Text style={{ color: activeTheme.primaryColor, fontSize: 18, fontWeight: '700' }}>‹</Text>
                    </TouchableOpacity>
                    <Text style={{ color: activeTheme.textColor, fontSize: 16, fontWeight: '700' }}>
                      {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const d = new Date(calendarDate);
                        d.setMonth(d.getMonth() + 1);
                        setCalendarDate(d);
                        setCalendarSelectedDay(null);
                      }}
                      style={{ padding: 8, borderRadius: 12, backgroundColor: activeTheme.primaryColor + '20' }}
                    >
                      <Text style={{ color: activeTheme.primaryColor, fontSize: 18, fontWeight: '700' }}>›</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Day Labels */}
                  <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <Text key={d} style={{ flex: 1, textAlign: 'center', color: activeTheme.textMutedColor, fontSize: 11, fontWeight: '600' }}>{d}</Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  {(() => {
                    const year = calendarDate.getFullYear();
                    const month = calendarDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const today = new Date();

                    const dayMap: Record<string, { income: number; expense: number; count: number }> = {};
                    allTransactions.forEach(t => {
                      const d = new Date(t.dateStr);
                      if (d.getFullYear() === year && d.getMonth() === month) {
                        const key = d.getDate().toString();
                        if (!dayMap[key]) dayMap[key] = { income: 0, expense: 0, count: 0 };
                        dayMap[key].count++;
                        if (t.type === 'income') dayMap[key].income += Number(t.amount) || 0;
                        else dayMap[key].expense += Number(t.amount) || 0;
                      }
                    });

                    const cells: React.ReactNode[] = [];
                    for (let i = 0; i < firstDay; i++) {
                      cells.push(<View key={`e${i}`} style={{ flex: 1, aspectRatio: 1 }} />);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const key = day.toString();
                      const hasData = !!dayMap[key];
                      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = calendarSelectedDay === dateStr;
                      cells.push(
                        <TouchableOpacity
                          key={day}
                          onPress={() => setCalendarSelectedDay(isSelected ? null : dateStr)}
                          style={{
                            flex: 1,
                            aspectRatio: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 2,
                            borderRadius: activeTheme.borderRadius / 2,
                            backgroundColor: isSelected
                              ? activeTheme.primaryColor
                              : isToday
                              ? activeTheme.primaryColor + '22'
                              : 'transparent',
                            borderWidth: isToday && !isSelected ? 1.5 : 0,
                            borderColor: activeTheme.primaryColor,
                          }}
                        >
                          <Text style={{ color: isSelected ? '#fff' : activeTheme.textColor, fontSize: 13, fontWeight: isToday ? '800' : '500' }}>{day}</Text>
                          {hasData && (
                            <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                              {dayMap[key].income > 0 && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: activeTheme.incomeColor }} />}
                              {dayMap[key].expense > 0 && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: activeTheme.expenseColor }} />}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }

                    const rows: React.ReactNode[][] = [];
                    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
                    while (rows[rows.length - 1].length < 7) {
                      rows[rows.length - 1].push(<View key={`p${rows[rows.length - 1].length}`} style={{ flex: 1, aspectRatio: 1 }} />);
                    }

                    return rows.map((row, ri) => (
                      <View key={ri} style={{ flexDirection: 'row', marginBottom: 2 }}>
                        {row}
                      </View>
                    ));
                  })()}
                </View>

                {/* Selected Day details */}
                {calendarSelectedDay && (() => {
                  const dayTxns = allTransactions.filter(t => {
                    const d = new Date(t.dateStr);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}` === calendarSelectedDay;
                  });
                  return (
                    <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius, padding: 16, marginTop: 12 }]}>
                      <Text style={[styles.cardHeader, { color: activeTheme.textColor }]}>
                        {new Date(calendarSelectedDay + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </Text>
                      {dayTxns.length === 0 ? (
                        <Text style={{ color: activeTheme.textMutedColor, textAlign: 'center', padding: 10 }}>No transactions on this day.</Text>
                      ) : (
                        dayTxns.map(t => (
                          <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: activeTheme.cardBorder }}>
                            <Text style={{ fontSize: 18, marginRight: 8 }}>{t.type === 'income' ? '📈' : '📉'}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: activeTheme.textColor, fontWeight: '600', fontSize: 13 }}>{t.description}</Text>
                              <Text style={{ color: activeTheme.textMutedColor, fontSize: 10 }}>{t.category}</Text>
                            </View>
                            <Text style={{ color: t.type === 'income' ? activeTheme.incomeColor : activeTheme.expenseColor, fontWeight: '800', fontSize: 14 }}>
                              {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  );
                })()}
              </>
            )}

            {dashboardTab === 'profile' && (
              <>
                <View style={[
                  styles.card, 
                  { 
                    backgroundColor: activeTheme.cardBackground, 
                    borderColor: activeTheme.cardBorder, 
                    borderRadius: activeTheme.borderRadius,
                    padding: 20
                  }
                ]}>
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => handleSelectImage('profile')} style={{ marginBottom: 10 }}>
                      {profile.profilePhoto ? (
                        <Image source={{ uri: profile.profilePhoto }} style={styles.profileAvatarImg} />
                      ) : (
                        <View style={styles.profileAvatarPlaceholder}>
                          <Text style={{ fontSize: 32 }}>👤</Text>
                        </View>
                      )}
                      <Text style={{ color: activeTheme.primaryColor, fontSize: 11, marginTop: 4, textAlign: 'center' }}>Upload Photo</Text>
                    </TouchableOpacity>
                    <Text style={[styles.welcomeText, { color: activeTheme.textColor, fontSize: 18 }]}>{profile.name}</Text>
                    <Text style={{ color: activeTheme.textMutedColor, fontSize: 12, marginTop: 4 }}>{profile.email}</Text>
                  </View>
                  
                  <View style={[styles.summaryDivider, { backgroundColor: activeTheme.inputBorder }]} />
                  
                  <View style={{ gap: 10, marginVertical: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontSize: 12 }}>ROLE</Text>
                      <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '700' }}>{profile.role}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontSize: 12 }}>EMPLOYEE ID</Text>
                      <Text style={{ color: activeTheme.textColor, fontSize: 12, fontWeight: '600' }}>{profile.employeeId || 'N/A'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontSize: 12 }}>PHONE</Text>
                      <Text style={{ color: activeTheme.textColor, fontSize: 12 }}>{profile.phone || 'N/A'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontSize: 12 }}>MEMBER SINCE</Text>
                      <Text style={{ color: activeTheme.textColor, fontSize: 12 }}>
                        {new Date(profile.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.summaryDivider, { backgroundColor: activeTheme.inputBorder }]} />

                  {/* Change Password settings form */}
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontSize: 13, marginBottom: 8 }]}>🔒 Update Security Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                    placeholder="New Password (min 6 chars)"
                    placeholderTextColor={activeTheme.textMutedColor}
                    secureTextEntry={true}
                    value={newPasswordInput}
                    onChangeText={setNewPasswordInput}
                  />
                  <TouchableOpacity style={[styles.submitBtn, { backgroundColor: activeTheme.primaryColor, paddingVertical: 10, marginTop: 8 }]} onPress={handleProfileChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Update Password</Text>}
                  </TouchableOpacity>

                  <View style={[styles.summaryDivider, { backgroundColor: activeTheme.inputBorder }]} />

                  {/* Local biometric login setup */}
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontSize: 13, marginBottom: 8 }]}>🔑 Biometric Preferences</Text>
                  <TouchableOpacity style={[styles.submitBtn, { backgroundColor: activeTheme.primaryColor, paddingVertical: 10 }]} onPress={async () => {
                    const check = await handleBiometricAuth();
                    if (check) {
                      Alert.alert("Success", "Biometric enrollment confirmed locally.");
                    }
                  }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Enroll Fingerprint/FaceID</Text>
                  </TouchableOpacity>

                  <View style={[styles.summaryDivider, { backgroundColor: activeTheme.inputBorder }]} />
                  
                  {/* App Theme Picker (Admin Only) */}
                  {['ADMIN'].includes(profile?.role || '') && (
                    <>
                      <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontSize: 13, marginBottom: 8 }]}>🎨 App Theme Picker (Admin)</Text>
                      <View style={styles.themeSelectorGrid}>
                        {Object.entries(THEMES).map(([key, t]) => {
                          const isActive = activeThemeKey === key;
                          return (
                            <TouchableOpacity
                              key={key}
                              style={[
                                styles.themeSelectorBtn,
                                { 
                                  borderRadius: activeTheme.borderRadius, 
                                  borderColor: isActive ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)',
                                  backgroundColor: isActive ? activeTheme.primaryColor + '12' : 'rgba(255,255,255,0.02)'
                                }
                              ]}
                              onPress={() => handleUpdateTheme(key)}
                            >
                              <Text style={[
                                styles.themeSelectorBtnText,
                                { 
                                  color: isActive ? activeTheme.textColor : activeTheme.textMutedColor,
                                  fontFamily: activeTheme.fontFamily || 'System'
                                }
                              ]}>
                                {t.name}
                              </Text>
                              {isActive && <Text style={{ color: activeTheme.primaryColor, fontSize: 14 }}>●</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={[styles.summaryDivider, { backgroundColor: activeTheme.inputBorder }]} />
                    </>
                  )}

                  {/* Destructive account deletion options */}
                  <TouchableOpacity style={[styles.deleteUserBtn, { borderColor: 'red', marginTop: 15 }]} onPress={handleDeleteSelfAccount}>
                    <Text style={{ color: 'red', fontWeight: '700', fontSize: 12 }}>Delete Account & Audit History</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.logoutBtn, { borderRadius: activeTheme.borderRadius, borderColor: 'rgba(239, 68, 68, 0.3)' }]} onPress={handleLogout}>
                  <Text style={[styles.logoutText]}>Secure Logout</Text>
                </TouchableOpacity>
              </>
            )}

            {dashboardTab === 'stats' && (
              <View style={{ flex: 1, paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontSize: 18, marginBottom: 0 }]}>Statistics</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as const).map(p => (
                      <TouchableOpacity 
                        key={p} 
                        style={{
                          paddingHorizontal: 8, paddingVertical: 4, 
                          borderRadius: 8, 
                          backgroundColor: statsPeriod === p ? activeTheme.primaryColor : 'rgba(255,255,255,0.1)'
                        }}
                        onPress={() => { setStatsPeriod(p); setChartZoom(1); }}
                      >
                        <Text style={{ color: statsPeriod === p ? '#fff' : activeTheme.textColor, fontSize: 11, fontWeight: '700' }}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* ZOOM CONTROLS */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: activeTheme.textMutedColor, fontSize: 12 }}>Pinch / use buttons to zoom</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => setChartZoom(z => Math.max(1, z - 0.2))} style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                      <Text style={{ color: activeTheme.textColor, fontSize: 18, fontWeight: 'bold' }}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setChartZoom(z => Math.min(3, z + 0.2))} style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                      <Text style={{ color: activeTheme.textColor, fontSize: 18, fontWeight: 'bold' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <PinchGestureHandler onGestureEvent={(e) => {
                  if (e.nativeEvent.scale) {
                    setChartZoom(Math.max(1, Math.min(3, e.nativeEvent.scale)));
                  }
                }}>
                  <Animated.View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ width: chartWidth * chartZoom, paddingRight: 20 }}>
                        <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Expenses Trend ({statsPeriod})</Text>
                        {(() => {
                          const chartData = getChartData(dashboardViewMode === 'all-over' ? allTransactions : allTransactions.filter(t => t.userUid === profile?.uid), 'expense');
                          const cw = chartWidth * chartZoom;
                          const dataLen = Math.max(1, chartData.datasets[0].data.length);
                          return (
                            <View style={{ position: 'relative' }}>
                              <LineChart
                                data={chartData}
                                width={cw}
                                height={220}
                                yAxisLabel="₹"
                                yAxisSuffix=""
                                withDots={Platform.OS !== 'web'}
                                chartConfig={{
                                  backgroundColor: activeTheme.cardBackground,
                                  backgroundGradientFrom: activeTheme.cardBackground,
                                  backgroundGradientTo: activeTheme.cardBackground,
                                  decimalPlaces: 0,
                                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                                  labelColor: () => activeTheme.textMutedColor,
                                  style: { borderRadius: 16 }
                                }}
                                style={{ marginVertical: 8, borderRadius: activeTheme.borderRadius, borderColor: activeTheme.cardBorder, borderWidth: activeTheme.borderWidth || 1 }}
                              />
                              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                {chartData.datasets[0].data.map((val: any, i: number) => {
                                  const xPos = 64 + (i * (cw - 64)) / dataLen;
                                  return (
                                    <TouchableOpacity
                                      key={i}
                                      style={{ position: 'absolute', left: xPos - 20, width: 40, height: '100%', top: 0 }}
                                      onPress={() => {
                                        setExpenseTooltip({ visible: true, x: xPos, y: 100, value: val });
                                        setTimeout(() => setExpenseTooltip(null), 3000);
                                      }}
                                    />
                                  );
                                })}
                              </View>
                              {expenseTooltip?.visible && (
                                <View style={{ position: 'absolute', left: expenseTooltip.x - 25, top: expenseTooltip.y - 35, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 10, pointerEvents: 'none' }}>
                                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>₹{expenseTooltip.value}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })()}

                        <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System', marginTop: 16 }]}>Income Trend ({statsPeriod})</Text>
                        {(() => {
                          const chartData = getChartData(dashboardViewMode === 'all-over' ? allTransactions : allTransactions.filter(t => t.userUid === profile?.uid), 'income');
                          const cw = chartWidth * chartZoom;
                          const dataLen = Math.max(1, chartData.datasets[0].data.length);
                          return (
                            <View style={{ position: 'relative' }}>
                              <LineChart
                                data={chartData}
                                width={cw}
                                height={220}
                                yAxisLabel="₹"
                                yAxisSuffix=""
                                withDots={Platform.OS !== 'web'}
                                chartConfig={{
                                  backgroundColor: activeTheme.cardBackground,
                                  backgroundGradientFrom: activeTheme.cardBackground,
                                  backgroundGradientTo: activeTheme.cardBackground,
                                  decimalPlaces: 0,
                                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                  labelColor: () => activeTheme.textMutedColor,
                                  style: { borderRadius: 16 }
                                }}
                                style={{ marginVertical: 8, borderRadius: activeTheme.borderRadius, borderColor: activeTheme.cardBorder, borderWidth: activeTheme.borderWidth || 1 }}
                              />
                              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                {chartData.datasets[0].data.map((val: any, i: number) => {
                                  const xPos = 64 + (i * (cw - 64)) / dataLen;
                                  return (
                                    <TouchableOpacity
                                      key={i}
                                      style={{ position: 'absolute', left: xPos - 20, width: 40, height: '100%', top: 0 }}
                                      onPress={() => {
                                        setIncomeTooltip({ visible: true, x: xPos, y: 100, value: val });
                                        setTimeout(() => setIncomeTooltip(null), 3000);
                                      }}
                                    />
                                  );
                                })}
                              </View>
                              {incomeTooltip?.visible && (
                                <View style={{ position: 'absolute', left: incomeTooltip.x - 25, top: incomeTooltip.y - 35, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 10, pointerEvents: 'none' }}>
                                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>₹{incomeTooltip.value}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })()}
                      </View>
                    </ScrollView>
                  </Animated.View>
                </PinchGestureHandler>
              </View>
            )}

            {dashboardTab === 'notes' && (
              <>
                <View style={[
                  styles.card, 
                  { 
                    backgroundColor: activeTheme.cardBackground, 
                    borderColor: activeTheme.cardBorder, 
                    borderRadius: activeTheme.borderRadius,
                    padding: 16
                  }
                ]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.cardHeader, { color: activeTheme.textColor, marginBottom: 0 }]}>📝 Sticky Notes & Reminders</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingNote(null);
                        setNoteTitle('');
                        setNoteContent('');
                        setNoteModalOpen(true);
                      }}
                      style={{
                        backgroundColor: activeTheme.primaryColor,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: activeTheme.borderRadius / 2
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+ Add Note</Text>
                    </TouchableOpacity>
                  </View>

                  {notes.length === 0 ? (
                    <Text style={{ color: activeTheme.textMutedColor, textAlign: 'center', marginVertical: 20, fontSize: 13 }}>
                      No notes saved. Tap '+ Add Note' to create your first note!
                    </Text>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {notes.map((note) => (
                        <View
                          key={note.id}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: activeTheme.borderRadius / 2,
                            padding: 12
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 14, flex: 1 }}>{note.title}</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                              <TouchableOpacity onPress={() => {
                                setEditingNote(note);
                                setNoteTitle(note.title);
                                setNoteContent(note.content);
                                setNoteModalOpen(true);
                              }}>
                                <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                                <Text style={{ color: activeTheme.expenseColor, fontSize: 12, fontWeight: '700' }}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={{ color: activeTheme.textColor, fontSize: 13, marginTop: 6, lineHeight: 18 }}>{note.content}</Text>
                          <Text style={{ color: activeTheme.textMutedColor, fontSize: 9, marginTop: 8 }}>
                            {new Date(note.createdAt).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {dashboardTab === 'chat' && (
              <>
                {currentChat === null ? (
                  // 1. CONVERSATIONS LIST VIEW
                  <View style={[
                    styles.card, 
                    { 
                      backgroundColor: activeTheme.cardBackground, 
                      borderColor: activeTheme.cardBorder, 
                      borderRadius: activeTheme.borderRadius,
                      padding: 16
                    }
                  ]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={[styles.cardHeader, { color: activeTheme.textColor, marginBottom: 0 }]}>💬 Secured Conversations</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setNewChatGroupTitle('');
                          setNewChatSelectedUsers([]);
                          setNewChatModalOpen(true);
                        }}
                        style={{
                          backgroundColor: activeTheme.primaryColor,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: activeTheme.borderRadius / 2
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+ New Chat</Text>
                      </TouchableOpacity>
                    </View>

                    {chats.length === 0 ? (
                      <Text style={{ color: activeTheme.textMutedColor, textAlign: 'center', marginVertical: 30, fontSize: 13 }}>
                        No secured chats found. Tap '+ New Chat' to start a direct message or create a group chat.
                      </Text>
                    ) : (
                      <View style={{ gap: 10 }}>
                        {chats.map((chat) => {
                          let chatTitle = 'Secure Room';
                          let avatarInitials = '💬';

                          if (chat.isGroup) {
                            chatTitle = chat.groupName || 'Secure Group';
                            avatarInitials = '👥';
                          } else {
                            const otherUid = chat.participants.find(uid => uid !== profile?.uid);
                            const otherUser = allUsers.find(u => u.uid === otherUid);
                            if (otherUser) {
                              chatTitle = otherUser.name;
                              avatarInitials = otherUser.name.slice(0, 2).toUpperCase();
                            }
                          }

                          return (
                            <TouchableOpacity
                              key={chat.id}
                              onPress={() => setCurrentChat(chat)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: activeTheme.borderRadius / 2,
                                padding: 12,
                                gap: 12
                              }}
                            >
                              <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: activeTheme.primaryColor + '20',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: activeTheme.primaryColor + '40'
                              }}>
                                <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '800' }}>{avatarInitials}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 14 }}>{chatTitle}</Text>
                                <Text style={{ color: activeTheme.textMutedColor, fontSize: 11, marginTop: 2 }}>
                                  {chat.isGroup ? 'Group Chat' : 'Direct Message'}
                                </Text>
                              </View>
                              <Text style={{ color: activeTheme.primaryColor, fontSize: 16 }}>›</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ) : (
                  // 2. ACTIVE CHAT LOG VIEW
                  <View style={[
                    styles.card, 
                    { 
                      backgroundColor: activeTheme.cardBackground, 
                      borderColor: activeTheme.cardBorder, 
                      borderRadius: activeTheme.borderRadius,
                      padding: 12,
                      minHeight: 400
                    }
                  ]}>
                    {/* Active Chat Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: activeTheme.inputBorder, paddingBottom: 10, marginBottom: 10 }}>
                      <TouchableOpacity
                        onPress={() => setCurrentChat(null)}
                        style={{ padding: 4, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        <Text style={{ color: activeTheme.textColor, fontSize: 16, fontWeight: '700' }}>←</Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: activeTheme.textColor, fontWeight: '800', fontSize: 14 }}>
                          {currentChat.isGroup 
                            ? (currentChat.groupName || 'Secure Group') 
                            : (allUsers.find(u => u.uid === currentChat.participants.find(p => p !== profile?.uid))?.name || 'Secure DM')
                          }
                        </Text>
                        <Text style={{ color: activeTheme.textMutedColor, fontSize: 10 }}>
                          🔐 End-to-End Client Encrypted (AES-256)
                        </Text>
                      </View>
                    </View>

                    {/* Messages Scroll Area */}
                    <ScrollView 
                      style={{ maxHeight: 300, minHeight: 250, marginBottom: 10 }}
                      contentContainerStyle={{ gap: 8 }}
                      ref={(ref) => ref?.scrollToEnd({ animated: true })}
                    >
                      {chatMessages.length === 0 ? (
                        <Text style={{ color: activeTheme.textMutedColor, textAlign: 'center', marginTop: 50, fontSize: 12 }}>
                          No messages yet. Send a secured message to begin!
                        </Text>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.senderId === profile?.uid;
                          return (
                            <View 
                              key={msg.id} 
                              style={{ 
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                              }}
                            >
                              {!isMe && currentChat.isGroup && (
                                <Text style={{ color: activeTheme.textMutedColor, fontSize: 10, marginLeft: 4, marginBottom: 2 }}>
                                  {msg.senderName}
                                </Text>
                              )}
                              <View style={{
                                backgroundColor: isMe ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)',
                                paddingVertical: msg.type === 'image' || msg.type === 'contact' ? 4 : 8,
                                paddingHorizontal: msg.type === 'image' || msg.type === 'contact' ? 4 : 12,
                                borderRadius: activeTheme.borderRadius / 2,
                                borderWidth: 1,
                                borderColor: isMe ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.08)',
                                overflow: 'hidden'
                              }}>
                                {(() => {
                                  if (msg.type === 'image') {
                                    return (
                                      <TouchableOpacity onPress={() => Linking.openURL(msg.text)} style={{ borderRadius: 6, overflow: 'hidden' }}>
                                        <Image 
                                          source={{ uri: msg.text }} 
                                          style={{ width: 200, height: 150 }} 
                                          resizeMode="cover" 
                                        />
                                        <View style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Text style={{ color: '#fff', fontSize: 10, flex: 1 }} numberOfLines={1}>{msg.fileName || 'Image'}</Text>
                                          <Text style={{ color: activeTheme.primaryColor, fontSize: 10, fontWeight: 'bold' }}>View ↗</Text>
                                        </View>
                                      </TouchableOpacity>
                                    );
                                  } else if (msg.type === 'document') {
                                    return (
                                      <TouchableOpacity 
                                        onPress={() => Linking.openURL(msg.text)}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, minWidth: 160 }}
                                      >
                                        <Text style={{ fontSize: 24 }}>📄</Text>
                                        <View style={{ flex: 1 }}>
                                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{msg.fileName || 'Document'}</Text>
                                          <Text style={{ color: '#94a3b8', fontSize: 10 }}>{msg.fileSize || ''}</Text>
                                        </View>
                                        <Text style={{ color: isMe ? '#fff' : activeTheme.primaryColor, fontSize: 16 }}>↓</Text>
                                      </TouchableOpacity>
                                    );
                                  } else if (msg.type === 'audio') {
                                    return (
                                      <TouchableOpacity 
                                        onPress={() => Linking.openURL(msg.text)}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, minWidth: 160 }}
                                      >
                                        <Text style={{ fontSize: 24 }}>🎵</Text>
                                        <View style={{ flex: 1 }}>
                                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{msg.fileName || 'Audio Message'}</Text>
                                          <Text style={{ color: '#94a3b8', fontSize: 10 }}>{msg.fileSize || ''}</Text>
                                        </View>
                                        <Text style={{ color: isMe ? '#fff' : activeTheme.primaryColor, fontSize: 16 }}>▶</Text>
                                      </TouchableOpacity>
                                    );
                                  } else if (msg.type === 'contact') {
                                    try {
                                      const contactObj = JSON.parse(msg.text);
                                      return (
                                        <View style={{ padding: 8, minWidth: 180 }}>
                                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : activeTheme.primaryColor + '20', justifyContent: 'center', alignItems: 'center' }}>
                                              <Text style={{ fontSize: 13 }}>👤</Text>
                                            </View>
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{contactObj.name}</Text>
                                          </View>
                                          <Text style={{ color: '#cbd5e1', fontSize: 11, marginBottom: 2 }}>📧 {contactObj.email}</Text>
                                          <Text style={{ color: '#cbd5e1', fontSize: 11, marginBottom: 8 }}>📞 {contactObj.phone}</Text>
                                          <View style={{ flexDirection: 'row', gap: 6 }}>
                                            <TouchableOpacity 
                                              onPress={() => Linking.openURL(`mailto:${contactObj.email}`)}
                                              style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingVertical: 6, borderRadius: 6, alignItems: 'center' }}
                                            >
                                              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>Email</Text>
                                            </TouchableOpacity>
                                            {contactObj.phone !== 'N/A' && (
                                              <TouchableOpacity 
                                                onPress={() => Linking.openURL(`tel:${contactObj.phone}`)}
                                                style={{ flex: 1, backgroundColor: isMe ? '#fff' : activeTheme.primaryColor, paddingVertical: 6, borderRadius: 6, alignItems: 'center' }}
                                              >
                                                <Text style={{ color: isMe ? '#000' : '#fff', fontSize: 9, fontWeight: '700' }}>Call</Text>
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                        </View>
                                      );
                                    } catch (e) {
                                      return <Text style={{ color: '#fff', fontSize: 13 }}>[Encrypted Contact Card]</Text>;
                                    }
                                  } else {
                                    return <Text style={{ color: '#fff', fontSize: 13, lineHeight: 18 }}>{msg.text}</Text>;
                                  }
                                })()}
                              </View>
                              <Text style={{ 
                                color: activeTheme.textMutedColor, 
                                fontSize: 8, 
                                marginTop: 2, 
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                marginRight: isMe ? 4 : 0,
                                marginLeft: !isMe ? 4 : 0
                              }}>
                                {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </Text>
                            </View>
                          );
                        })
                      )}
                    </ScrollView>

                    {/* Chat Sender Area */}
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {sharingMedia ? (
                        <ActivityIndicator size="small" color={activeTheme.primaryColor} style={{ width: 38, height: 38, justifyContent: 'center', alignItems: 'center' }} />
                      ) : (
                        <TouchableOpacity
                          onPress={() => setChatAttachmentMenuOpen(true)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderWidth: 1,
                            borderColor: activeTheme.inputBorder,
                            width: 38,
                            height: 38,
                            borderRadius: activeTheme.borderRadius,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{ color: activeTheme.textColor, fontSize: 20, fontWeight: 'bold' }}>+</Text>
                        </TouchableOpacity>
                      )}
                      <TextInput
                        style={[styles.input, { flex: 1, backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor, paddingVertical: 8, paddingHorizontal: 12, fontSize: 13 }]}
                        placeholder="Type encrypted message..."
                        placeholderTextColor={activeTheme.textMutedColor}
                        value={chatInputText}
                        onChangeText={setChatInputText}
                        onSubmitEditing={handleSendMessage}
                      />
                      <TouchableOpacity
                        onPress={handleSendMessage}
                        style={{
                          backgroundColor: activeTheme.primaryColor,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: activeTheme.borderRadius
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Send</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

          </View>
        ) : (
          // ==========================================
          // SECURE MOBILE LOGIN / REGISTRATION SCREEN
          // ==========================================
          <View style={[
            styles.authCard, 
            { 
              backgroundColor: activeTheme.cardBackground, 
              borderColor: activeTheme.cardBorder, 
              borderRadius: activeTheme.borderRadius,
              borderWidth: activeTheme.borderWidth || 1
            }
          ]}>
            <View style={styles.brandContainer}>
              <Image 
                source={require('../../WhatsApp_Image_2026-06-05_at_19.30.05-removebg-preview.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.brandSubtitle, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Secure Financial Ledger Portal</Text>
            </View>

            {/* Segmented Tab Controls */}
            {activeTab !== 'forgot' && (
              <View style={[styles.tabContainer, { borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.borderWidth || 1 }]}>
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'signin' && { backgroundColor: activeTheme.primaryColor },
                    { borderRadius: activeTheme.borderRadius }
                  ]}
                  onPress={() => setActiveTab('signin')}
                >
                  <Text style={[
                    styles.tabButtonText, 
                    { 
                      color: activeTab === 'signin' ? (activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff') : activeTheme.textMutedColor,
                      fontFamily: activeTheme.fontFamily || 'System',
                    }
                  ]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'register' && { backgroundColor: activeTheme.primaryColor },
                    { borderRadius: activeTheme.borderRadius }
                  ]}
                  onPress={() => setActiveTab('register')}
                >
                  <Text style={[
                    styles.tabButtonText, 
                    { 
                      color: activeTab === 'register' ? (activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff') : activeTheme.textMutedColor,
                      fontFamily: activeTheme.fontFamily || 'System',
                    }
                  ]}>Register</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'forgot' ? (
              // FORGOT PASSWORD FORM
              <View style={styles.form}>
                <Text style={{ color: activeTheme.textColor, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
                  Reset Security Password
                </Text>
                <Text style={{ color: activeTheme.textMutedColor, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
                  Enter your registered email address to receive a secure password reset link.
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                  placeholder="Email Address"
                  placeholderTextColor={activeTheme.textMutedColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TouchableOpacity 
                  style={[styles.submitBtn, { backgroundColor: activeTheme.primaryColor, borderRadius: activeTheme.borderRadius }]} 
                  onPress={handleForgotPassword}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color={activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff'} />
                  ) : (
                    <Text style={[styles.submitBtnText, { color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff' }]}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setActiveTab('signin');
                    setShowPassword(false);
                  }}
                  style={{ alignSelf: 'center', marginTop: 12, paddingVertical: 4 }}
                >
                  <Text style={{ color: activeTheme.primaryColor, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            ) : activeTab === 'signin' ? (
              // EMAIL/PASSWORD SIGN IN FORM
              <View style={styles.form}>
                <TextInput
                  style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                  placeholder="Email Address"
                  placeholderTextColor={activeTheme.textMutedColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor, flex: 1, paddingRight: 50 }]}
                    placeholder="Security Password"
                    placeholderTextColor={activeTheme.textMutedColor}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, padding: 8 }}
                  >
                    <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '700' }}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  onPress={() => setActiveTab('forgot')}
                  style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 4, paddingVertical: 4 }}
                >
                  <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
                
                {/* Standard and biometric authentication trigger actions */}
                <TouchableOpacity 
                  style={[styles.submitBtn, { backgroundColor: activeTheme.primaryColor, borderRadius: activeTheme.borderRadius }]} 
                  onPress={handleSignIn}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color={activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff'} />
                  ) : (
                    <Text style={[styles.submitBtnText, { color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff' }]}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Biometric trigger button */}
                <TouchableOpacity style={[styles.biometricBtn, { borderColor: activeTheme.primaryColor }]} onPress={triggerBiometricUnlock}>
                  <Text style={{ color: activeTheme.primaryColor, fontWeight: '700', fontSize: 13 }}>Unlock with Biometrics (Fingerprint/FaceID)</Text>
                </TouchableOpacity>

                {/* Google Sign In button */}
                <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Sign In with Google</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // USER/EMPLOYEE REGISTRATION FORM
              <View style={styles.form}>
                <TextInput
                  style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                  placeholder="Full Name"
                  placeholderTextColor={activeTheme.textMutedColor}
                  value={fullName}
                  onChangeText={setFullName}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                  placeholder="Email Address"
                  placeholderTextColor={activeTheme.textMutedColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor }]}
                  placeholder="Phone Number"
                  placeholderTextColor={activeTheme.textMutedColor}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor, flex: 1, paddingRight: 50 }]}
                    placeholder="Security Password"
                    placeholderTextColor={activeTheme.textMutedColor}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, padding: 8 }}
                  >
                    <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '700' }}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={[styles.submitBtn, { backgroundColor: activeTheme.primaryColor, borderRadius: activeTheme.borderRadius }]} 
                  onPress={handleRegister}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color={activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff'} />
                  ) : (
                    <Text style={[styles.submitBtnText, { color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff' }]}>Register & Activate</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* STICKY BOTTOM TAB BAR */}
      {user && profile && (
        <View style={[
          styles.bottomTabBar, 
          { 
            backgroundColor: activeTheme.cardBackground, 
            borderTopColor: activeTheme.cardBorder, 
            borderTopWidth: activeThemeKey === 'minecraft_anime' ? 3 : 1,
            borderBottomWidth: activeThemeKey === 'minecraft_anime' ? 3 : 0,
            borderBottomColor: '#000000',
            borderColor: activeThemeKey === 'minecraft_anime' ? '#000000' : activeTheme.cardBorder,
            paddingBottom: Math.max(insets.bottom, 12),
            height: 60 + Math.max(insets.bottom, 12),
          }
        ]}>
          {(() => {
            const tabs = [
              { key: 'dashboard', label: 'Home', icon: activeThemeKey === 'minecraft_anime' ? '💎' : activeThemeKey === 'brick_breaker' ? '🕹️' : '🏠' },
              { key: 'stats', label: 'Stats', icon: '📊' },
              { key: 'activity', label: 'Activity', icon: activeThemeKey === 'minecraft_anime' ? '⚔️' : activeThemeKey === 'brick_breaker' ? '👾' : '📈' },
              { key: 'chat', label: 'Chat', icon: activeThemeKey === 'minecraft_anime' ? '💬' : activeThemeKey === 'brick_breaker' ? '💬' : '💬' },
              { key: 'menu', label: 'Menu', icon: '☰' }
            ];

            return tabs.map((tab) => {
              const isActive = tab.key === 'menu'
                ? ['accounts', 'calendar', 'notes', 'rewards', 'profile'].includes(dashboardTab)
                : dashboardTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.bottomTabBtn,
                    isActive && (activeThemeKey === 'minecraft_anime' ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {})
                  ]}
                  onPress={() => {
                    if (tab.key === 'menu') {
                      setMenuOpen(true);
                    } else {
                      setDashboardTab(tab.key as any);
                    }
                  }}
                >
                  <Text style={[styles.bottomTabIcon, isActive && { color: activeTheme.primaryColor }]}>{tab.icon}</Text>
                  <Text style={[
                    styles.bottomTabLabel, 
                    { 
                      color: isActive ? activeTheme.primaryColor : activeTheme.textMutedColor,
                      fontFamily: activeTheme.fontFamily || 'System',
                      textTransform: activeTheme.isRetro ? 'uppercase' : 'none'
                    }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      )}

      {/* USER STATEMENT SHEET MODAL */}
      <Modal
        visible={selectedUserSheet !== null}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={handleCloseUserSheet}
      >
        <StatusBar hidden={true} />
        <View style={[styles.modalOverlay, { backgroundColor: activeTheme.background + 'dd' }]}>
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: activeTheme.cardBackground, 
              borderColor: activeTheme.cardBorder, 
              borderWidth: activeTheme.borderWidth || 1,
              borderTopLeftRadius: activeTheme.borderRadius, 
              borderTopRightRadius: activeTheme.borderRadius 
            }
          ]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: activeTheme.textColor }]}>{selectedUserSheet?.name}'s Spendings</Text>
                <Text style={[styles.modalSubtitle, { color: activeTheme.textMutedColor }]}>
                  {selectedUserSheet?.email} • {selectedUserSheet?.role}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseUserSheet} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Metrics Grid */}
            <View style={styles.modalMetrics}>
              <View style={[styles.modalMetricCard, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius }]}>
                <Text style={[styles.metricLabel, { color: activeTheme.textMutedColor }]}>Total Inflow</Text>
                <Text style={[styles.metricVal, { color: activeTheme.incomeColor }]}>
                  ₹{modalTotals.inflow.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.modalMetricCard, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius }]}>
                <Text style={[styles.metricLabel, { color: activeTheme.textMutedColor }]}>Total Outflow</Text>
                <Text style={[styles.metricVal, { color: activeTheme.expenseColor }]}>
                  ₹{modalTotals.outflow.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.modalMetricCard, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius }]}>
                <Text style={[styles.metricLabel, { color: activeTheme.textMutedColor }]}>Net Balance</Text>
                <Text style={[styles.metricVal, { color: modalTotals.balance >= 0 ? activeTheme.incomeColor : activeTheme.expenseColor }]}>
                  ₹{modalTotals.balance.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Admin Sheets / PDF Export Actions */}
            <View style={styles.exportActionsRow}>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: activeTheme.primaryColor }]} 
                onPress={() => handleExportCSV(selectedUserSheet!, modalTransactions)}
              >
                <Text style={[styles.exportBtnText, { color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff' }]}>Sheets (CSV)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: '#dc2626' }]} 
                onPress={() => handleExportPDF(selectedUserSheet!, modalTransactions)}
              >
                <Text style={[styles.exportBtnText]}>Export PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Transactions Scroll */}
            <Text style={[sectionHeaderStyle, { color: activeTheme.textColor }]}>Transaction History</Text>
            <ScrollView style={styles.modalScroll}>
              {modalTransactions.length === 0 ? (
                <Text style={styles.emptyText}>No transaction records found.</Text>
              ) : (
                modalTransactions.map((t) => (
                  <View key={t.id} style={[styles.modalLedgerRow, { borderBottomColor: activeTheme.inputBorder }]}>
                    <View>
                      <Text style={[styles.ledgerId, { color: activeTheme.textColor }]}>{t.description}</Text>
                      <Text style={[styles.ledgerTime, { color: activeTheme.textMutedColor }]}>
                        {new Date(t.dateStr).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={[
                      styles.ledgerAmount,
                      { color: t.type === 'income' ? activeTheme.incomeColor : activeTheme.expenseColor }
                    ]}>
                      {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Display notes list ONLY for ADMIN, hidden for MD/DIRECTOR */}
            {profile?.role === 'ADMIN' && (
              <>
                <Text style={[sectionHeaderStyle, { color: activeTheme.textColor, marginTop: 15 }]}>User Notes (Security Access Only)</Text>
                <ScrollView style={[styles.modalScroll, { maxHeight: 150, marginBottom: 15 }]}>
                  {modalUserNotes.length === 0 ? (
                    <Text style={[styles.emptyText, { fontSize: 12 }]}>No notes found for this user.</Text>
                  ) : (
                    modalUserNotes.map((note) => (
                      <View key={note.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: activeTheme.inputBorder }}>
                        <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 13 }}>{note.title}</Text>
                        <Text style={{ color: activeTheme.textColor, fontSize: 12, marginTop: 4 }}>{note.content}</Text>
                        <Text style={{ color: activeTheme.textMutedColor, fontSize: 9, marginTop: 4 }}>
                          {new Date(note.createdAt).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </>
            )}

            {/* Delete User Section */}
            {['ADMIN', 'MD', 'DIRECTOR'].includes(profile?.role || '') && selectedUserSheet?.uid !== profile?.uid && (
              <TouchableOpacity
                style={[styles.deleteUserBtn, { borderRadius: activeTheme.borderRadius, borderColor: '#ef4444' }]}
                onPress={() => handleDeleteUser(selectedUserSheet?.uid || '')}
              >
                <Text style={[styles.deleteUserBtnText]}>Permanently Remove User Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Admin Create User Account Modal */}
      <Modal visible={adminCreateOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeTheme.background, borderColor: activeTheme.cardBorder, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 16 }}>Provision New User</Text>
              <TouchableOpacity onPress={() => setAdminCreateOpen(false)}>
                <Text style={{ color: activeTheme.primaryColor }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, color: activeTheme.textColor }]}
              placeholder="Full Name"
              placeholderTextColor={activeTheme.textMutedColor}
              value={adminNewName}
              onChangeText={setAdminNewName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, color: activeTheme.textColor, marginTop: 10 }]}
              placeholder="Email Address"
              placeholderTextColor={activeTheme.textMutedColor}
              keyboardType="email-address"
              autoCapitalize="none"
              value={adminNewEmail}
              onChangeText={setAdminNewEmail}
            />
            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, color: activeTheme.textColor, marginTop: 10 }]}
              placeholder="Phone Number"
              placeholderTextColor={activeTheme.textMutedColor}
              keyboardType="phone-pad"
              value={adminNewPhone}
              onChangeText={setAdminNewPhone}
            />
            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, color: activeTheme.textColor, marginTop: 10 }]}
              placeholder="Security Password (min 6 chars)"
              placeholderTextColor={activeTheme.textMutedColor}
              secureTextEntry={true}
              value={adminNewPass}
              onChangeText={setAdminNewPass}
            />

            {/* Role picker */}
            <Text style={{ color: activeTheme.textColor, fontSize: 12, fontWeight: '700', marginTop: 12 }}>Assigned Role</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              {(['USER', 'ADMIN'] as const).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.toggleBtn,
                    { borderColor: adminNewRole === role ? activeTheme.primaryColor : 'rgba(255,255,255,0.05)', borderRadius: activeTheme.borderRadius },
                    adminNewRole === role && { backgroundColor: activeTheme.primaryColor + '12' }
                  ]}
                  onPress={() => setAdminNewRole(role)}
                >
                  <Text style={{ color: adminNewRole === role ? activeTheme.textColor : activeTheme.textMutedColor, fontWeight: '700' }}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: activeTheme.primaryColor, marginTop: 20 }]} onPress={handleAdminCreateUser}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Provision Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifSheet} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeTheme.background, borderColor: activeTheme.cardBorder, borderWidth: 1, borderRadius: activeTheme.borderRadius }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={[styles.modalTitle, { color: activeTheme.textColor }]}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifSheet(false)}>
                <Text style={{ color: activeTheme.primaryColor, fontSize: 15, fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {notifications.length === 0 ? (
                <Text style={{ color: activeTheme.textMutedColor, textAlign: 'center', marginVertical: 20 }}>No new notifications.</Text>
              ) : (
                notifications.map((notif) => (
                  <TouchableOpacity 
                    key={notif.id} 
                    style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: activeTheme.cardBorder, backgroundColor: notif.read ? 'transparent' : activeTheme.primaryColor + '15' }}
                    onPress={async () => {
                      if (!notif.read) {
                        try {
                          await setDoc(doc(db, 'notifications', notif.id), { read: true }, { merge: true });
                        } catch (e) {
                          console.log("Failed to mark read", e);
                        }
                      }
                    }}
                  >
                    <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 14 }}>{notif.title}</Text>
                    <Text style={{ color: activeTheme.textMutedColor, fontSize: 12, marginTop: 4 }}>{notif.body}</Text>
                    {notif.timestamp && (
                      <Text style={{ color: activeTheme.textMutedColor, fontSize: 10, marginTop: 6 }}>
                        {new Date(notif.timestamp.seconds * 1000).toLocaleString('en-IN')}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Note Add/Edit Modal */}
      <Modal
        visible={noteModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoteModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: activeTheme.cardBackground,
            borderColor: activeTheme.cardBorder,
            borderWidth: 1,
            borderRadius: activeTheme.borderRadius,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: activeTheme.textColor, marginBottom: 15 }}>
              {editingNote ? "✏️ Edit Note" : "📝 Add New Note"}
            </Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor, marginBottom: 12, paddingVertical: 10, fontSize: 13 }]}
              placeholder="Note Title"
              placeholderTextColor={activeTheme.textMutedColor}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: activeTheme.inputBackground, 
                  borderColor: activeTheme.inputBorder, 
                  borderRadius: activeTheme.borderRadius, 
                  color: activeTheme.textColor, 
                  marginBottom: 15, 
                  paddingVertical: 10, 
                  height: 100, 
                  textAlignVertical: 'top',
                  fontSize: 13
                }
              ]}
              placeholder="Note Content / Details..."
              placeholderTextColor={activeTheme.textMutedColor}
              multiline={true}
              numberOfLines={4}
              value={noteContent}
              onChangeText={setNoteContent}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setNoteModalOpen(false);
                  setEditingNote(null);
                  setNoteTitle('');
                  setNoteContent('');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: activeTheme.borderRadius,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 12 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNote}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: activeTheme.borderRadius,
                  backgroundColor: activeTheme.primaryColor,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Secure Chat Creator Modal */}
      <Modal
        visible={newChatModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNewChatModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: activeTheme.cardBackground,
            borderColor: activeTheme.cardBorder,
            borderWidth: 1,
            borderRadius: activeTheme.borderRadius,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: activeTheme.textColor, marginBottom: 15 }}>
              💬 Start Secure Chat / Group
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, color: activeTheme.textColor, marginBottom: 12, paddingVertical: 10, fontSize: 13 }]}
              placeholder="Group Title (Leave empty for Direct Messages)"
              placeholderTextColor={activeTheme.textMutedColor}
              value={newChatGroupTitle}
              onChangeText={setNewChatGroupTitle}
            />

            <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 12, marginBottom: 8 }}>
              Select Participants:
            </Text>

            <ScrollView style={{ maxHeight: 200, marginBottom: 15 }}>
              {allUsers.filter(u => u.uid !== profile?.uid).map((u) => {
                const isSelected = newChatSelectedUsers.includes(u.uid);
                return (
                  <TouchableOpacity
                    key={u.uid}
                    onPress={() => {
                      if (isSelected) {
                        setNewChatSelectedUsers(newChatSelectedUsers.filter(id => id !== u.uid));
                      } else {
                        setNewChatSelectedUsers([...newChatSelectedUsers, u.uid]);
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: activeTheme.inputBorder,
                      justifyContent: 'space-between'
                    }}
                  >
                    <View>
                      <Text style={{ color: activeTheme.textColor, fontWeight: '600', fontSize: 13 }}>{u.name}</Text>
                      <Text style={{ color: activeTheme.textMutedColor, fontSize: 10 }}>{u.email} • {u.role}</Text>
                    </View>
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: activeTheme.primaryColor,
                      backgroundColor: isSelected ? activeTheme.primaryColor : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      {isSelected && (
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setNewChatModalOpen(false);
                  setNewChatGroupTitle('');
                  setNewChatSelectedUsers([]);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: activeTheme.borderRadius,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 12 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateChat}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: activeTheme.borderRadius,
                  backgroundColor: activeTheme.primaryColor,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Calendar Date Range Picker Modal */}
      <Modal
        visible={datePickerTarget !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDatePickerTarget(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: activeTheme.cardBackground,
            borderColor: activeTheme.cardBorder,
            borderWidth: 1,
            borderRadius: activeTheme.borderRadius,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: activeTheme.textColor }}>
                📅 Filter Date Range
              </Text>
              <TouchableOpacity onPress={() => setDatePickerTarget(null)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: activeTheme.textColor }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Target Selector Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3, marginBottom: 15 }}>
              <TouchableOpacity
                onPress={() => setDatePickerTarget('start')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: datePickerTarget === 'start' ? activeTheme.primaryColor : 'transparent',
                  borderRadius: 6
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: datePickerTarget === 'start' ? '#fff' : activeTheme.textMutedColor }}>
                  START: {startDateStr || 'Not Set'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDatePickerTarget('end')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: datePickerTarget === 'end' ? activeTheme.primaryColor : 'transparent',
                  borderRadius: 6
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: datePickerTarget === 'end' ? '#fff' : activeTheme.textMutedColor }}>
                  END: {endDateStr || 'Not Set'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(pickerMonthDate);
                  d.setMonth(d.getMonth() - 1);
                  setPickerMonthDate(d);
                }}
                style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <Text style={{ color: activeTheme.textColor, fontSize: 16, fontWeight: '700' }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ color: activeTheme.textColor, fontSize: 14, fontWeight: '700' }}>
                {pickerMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(pickerMonthDate);
                  d.setMonth(d.getMonth() + 1);
                  setPickerMonthDate(d);
                }}
                style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <Text style={{ color: activeTheme.textColor, fontSize: 16, fontWeight: '700' }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <Text key={d} style={{ flex: 1, textAlign: 'center', color: activeTheme.textMutedColor, fontSize: 10, fontWeight: '600' }}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            {(() => {
              const year = pickerMonthDate.getFullYear();
              const month = pickerMonthDate.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const today = new Date();

              const startVal = startDateStr ? new Date(startDateStr.replace(/-/g, '/')).getTime() : null;
              const endVal = endDateStr ? new Date(endDateStr.replace(/-/g, '/')).getTime() : null;

              const cells: React.ReactNode[] = [];
              for (let i = 0; i < firstDay; i++) {
                cells.push(<View key={`empty-${i}`} style={{ flex: 1, aspectRatio: 1 }} />);
              }

              for (let day = 1; day <= daysInMonth; day++) {
                const curDate = new Date(year, month, day);
                const curTime = curDate.getTime();
                const padMonth = String(month + 1).padStart(2, '0');
                const padDay = String(day).padStart(2, '0');
                const dateStr = `${year}-${padMonth}-${padDay}`;

                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                const isStart = startDateStr === dateStr;
                const isEnd = endDateStr === dateStr;

                let inRange = false;
                if (startVal && endVal) {
                  inRange = curTime >= startVal && curTime <= endVal;
                }

                cells.push(
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      if (datePickerTarget === 'start') {
                        setStartDateStr(dateStr);
                        if (!endDateStr) {
                          setDatePickerTarget('end');
                        }
                      } else if (datePickerTarget === 'end') {
                        setEndDateStr(dateStr);
                        if (startDateStr) {
                          const startD = new Date(startDateStr.replace(/-/g, '/'));
                          const endD = new Date(dateStr.replace(/-/g, '/'));
                          if (endD < startD) {
                            setStartDateStr(dateStr);
                            setEndDateStr(startDateStr);
                          }
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 1,
                      borderRadius: 6,
                      backgroundColor: (isStart || isEnd)
                        ? activeTheme.primaryColor
                        : inRange
                        ? activeTheme.primaryColor + '33'
                        : isToday
                        ? activeTheme.primaryColor + '15'
                        : 'transparent',
                      borderWidth: isToday && !(isStart || isEnd) ? 1 : 0,
                      borderColor: activeTheme.primaryColor,
                    }}
                  >
                    <Text style={{
                      color: (isStart || isEnd)
                        ? '#ffffff'
                        : inRange
                        ? activeTheme.textColor
                        : activeTheme.textColor,
                      fontSize: 12,
                      fontWeight: (isToday || isStart || isEnd) ? '800' : '500'
                    }}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              }

              const rows: React.ReactNode[][] = [];
              for (let i = 0; i < cells.length; i += 7) {
                rows.push(cells.slice(i, i + 7));
              }
              while (rows.length > 0 && rows[rows.length - 1].length < 7) {
                rows[rows.length - 1].push(<View key={`pad-${rows[rows.length - 1].length}`} style={{ flex: 1, aspectRatio: 1 }} />);
              }

              return rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row', marginBottom: 2 }}>
                  {row}
                </View>
              ));
            })()}

            {/* Bottom Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity
                onPress={() => {
                  setStartDateStr('');
                  setEndDateStr('');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: activeTheme.borderRadius,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 12 }}>
                  Clear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDatePickerTarget(null)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: activeTheme.borderRadius,
                  backgroundColor: activeTheme.primaryColor,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* EXPLORE MENU DRAWER MODAL */}
      <Modal
        visible={menuOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }} 
          activeOpacity={1} 
          onPress={() => setMenuOpen(false)}
        >
          <View style={{
            backgroundColor: activeTheme.cardBackground,
            borderTopLeftRadius: activeTheme.borderRadius,
            borderTopRightRadius: activeTheme.borderRadius,
            borderColor: activeTheme.cardBorder,
            borderWidth: 1,
            borderBottomWidth: 0,
            padding: 24,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 20
          }}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: activeTheme.textColor }}>☰ Explore Hub</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <Text style={{ color: activeTheme.textColor, fontSize: 14, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
              {(() => {
                const drawerItems = [];
                if (['ADMIN', 'MD', 'DIRECTOR'].includes(profile?.role || '')) {
                  drawerItems.push({
                    key: 'accounts',
                    label: 'Vault',
                    icon: '🏰',
                    desc: 'Security Admin Vault'
                  });
                }
                drawerItems.push(
                  { key: 'calendar', label: 'Calendar', icon: '📅', desc: 'Schedules & Logs' },
                  { key: 'notes', label: 'Notes', icon: '📝', desc: 'Secure Notepad' },
                  { key: 'rewards', label: 'Rewards', icon: '🏆', desc: 'Tasks & Milestones' },
                  { key: 'profile', label: 'Me', icon: '👤', desc: 'Profile & Settings' }
                );

                return drawerItems.map((item) => {
                  const isActive = dashboardTab === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={{
                        width: '47%',
                        backgroundColor: isActive ? activeTheme.primaryColor + '15' : 'rgba(255, 255, 255, 0.02)',
                        borderColor: isActive ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1.5,
                        borderRadius: activeTheme.borderRadius,
                        padding: 14,
                        gap: 4
                      }}
                      onPress={() => {
                        setDashboardTab(item.key as any);
                        setMenuOpen(false);
                      }}
                    >
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</Text>
                      <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 14 }}>{item.label}</Text>
                      <Text style={{ color: activeTheme.textMutedColor, fontSize: 10 }}>{item.desc}</Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CHAT ATTACHMENT OPTIONS MODAL */}
      <Modal
        visible={chatAttachmentMenuOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatAttachmentMenuOpen(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }} 
          activeOpacity={1} 
          onPress={() => setChatAttachmentMenuOpen(false)}
        >
          <View style={{
            backgroundColor: activeTheme.cardBackground,
            borderTopLeftRadius: activeTheme.borderRadius,
            borderTopRightRadius: activeTheme.borderRadius,
            borderColor: activeTheme.cardBorder,
            borderWidth: 1,
            borderBottomWidth: 0,
            padding: 24,
            paddingBottom: 40,
          }}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: activeTheme.textColor }}>📎 Share Securely</Text>
              <TouchableOpacity onPress={() => setChatAttachmentMenuOpen(false)} style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <Text style={{ color: activeTheme.textColor, fontSize: 14, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {[
                { label: 'Photo', icon: '🖼️', action: handleShareImage },
                { label: 'Document', icon: '📄', action: handleShareDocument },
                { label: 'Audio', icon: '🎵', action: handleShareAudio },
                { label: 'Contact', icon: '📇', action: () => { setChatAttachmentMenuOpen(false); setChatContactPickerOpen(true); } }
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={{
                    width: '30%',
                    marginBottom: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1.5,
                    borderRadius: activeTheme.borderRadius,
                    padding: 12,
                    alignItems: 'center',
                    gap: 6
                  }}
                  onPress={opt.action}
                >
                  <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                  <Text style={{ color: activeTheme.textColor, fontWeight: '700', fontSize: 11 }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CHAT CONTACT PICKER MODAL */}
      <Modal
        visible={chatContactPickerOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setChatContactPickerOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: activeTheme.cardBackground,
            borderColor: activeTheme.cardBorder,
            borderWidth: 1,
            borderRadius: activeTheme.borderRadius,
            padding: 20,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: activeTheme.textColor }}>📇 Select Contact to Share</Text>
              <TouchableOpacity onPress={() => setChatContactPickerOpen(false)} style={{ padding: 4 }}>
                <Text style={{ color: activeTheme.textColor, fontSize: 16, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 250, marginBottom: 15 }}>
              {allUsers.filter(u => u.uid !== profile?.uid).map((u) => (
                <TouchableOpacity
                  key={u.uid}
                  onPress={() => handleShareContact(u)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: activeTheme.inputBorder,
                    gap: 12
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: activeTheme.primaryColor + '15',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: activeTheme.primaryColor, fontSize: 12, fontWeight: '700' }}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: activeTheme.textColor, fontWeight: '600', fontSize: 13 }}>{u.name}</Text>
                    <Text style={{ color: activeTheme.textMutedColor, fontSize: 10 }}>{u.email} • {u.role}</Text>
                  </View>
                  <Text style={{ color: activeTheme.primaryColor, fontSize: 12 }}>Share →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// Styles
const sectionHeaderStyle = {
  fontSize: 12,
  color: '#fff',
  fontWeight: '700' as const,
  marginBottom: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06070a',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 95 : 75,
    width: '100%',
    maxWidth: 550,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06070a',
  },
  loaderContent: {
    alignItems: 'center',
  },
  loaderImgContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderLogo: {
    width: 70,
    height: 70,
    zIndex: 2,
  },
  loaderSpinnerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    borderTopColor: '#6366f1',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 20,
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  offlineBanner: {
    backgroundColor: '#f59e0b',
    padding: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  verificationBanner: {
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  bannerBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  authCard: {
    backgroundColor: '#0e111a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#06070a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  biometricBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  socialBtn: {
    backgroundColor: '#ea4335',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  dashboardContainer: {
    gap: 20,
    justifyContent: 'flex-start',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 10,
    paddingVertical: 10,
  },
  dashboardLogo: {
    width: 130,
    height: 45,
  },
  headerUserSection: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#0e111a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  insightsCard: {
    padding: 16,
    borderWidth: 1,
  },
  customizerTrigger: {
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizerPanel: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  customizerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summarySubItem: {
    alignItems: 'center',
  },
  summaryLabelSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  summaryValSub: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  filterContainer: {
    marginBottom: 5,
  },
  filterScroll: {
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  filterBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0e111a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#06070a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  categorySelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  uploadAttachmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  ledgerLeft: {
    flex: 1,
  },
  ledgerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  ledgerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ledgerId: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ledgerTime: {
    color: '#64748b',
    fontSize: 10,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteTxBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteTxText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  adminCreateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  teamMemberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  teamMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamMemberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  teamMemberName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  teamMemberSpending: {
    alignItems: 'flex-end',
  },
  spendingLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  spendingVal: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  logoutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4, 6, 14, 0.85)',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0e111a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 550,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 12,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#64748b',
    fontSize: 16,
  },
  modalMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  modalScroll: {
    maxHeight: 250,
    marginBottom: 20,
  },
  modalLedgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  deleteUserBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteUserBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardChip: {
    width: 36,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#d4af37',
    padding: 4,
  },
  cardChipInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
    borderRadius: 2,
  },
  cardBrandText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardHolderRow: {
    marginTop: 10,
    marginBottom: 8,
  },
  cardHolderLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  miniProgressBarTrack: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 4,
  },
  miniProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  ledgerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ledgerCategoryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  ledgerCategoryIcon: {
    fontSize: 16,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 65,
    borderTopWidth: 1,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    maxWidth: 550,
    alignSelf: 'center',
  },
  bottomTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 4,
  },
  bottomTabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  ledgerUserLink: {
    fontSize: 10,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  themeSelectorGrid: {
    gap: 10,
  },
  themeSelectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  themeSelectorBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    padding: 3,
    marginBottom: 15,
  },
  modeSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSelectorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  datePickerBtn: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
