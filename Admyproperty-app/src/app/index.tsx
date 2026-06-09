import React, { useState, useEffect, useRef } from 'react';
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
  Platform
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebase';
import MoneyBackground from '../components/MoneyBackground';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
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
  deleteDoc
} from 'firebase/firestore';

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
};

const CATEGORY_ICONS: Record<string, string> = {
  Dining: '🍔',
  Travel: '🚗',
  Utilities: '⚡',
  Income: '📈',
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
    H: '#4a3222', // Hair
    S: '#e5a073', // Skin
    W: '#ffffff', // Eye white
    B: '#3a5ab8', // Eye blue
    N: '#bd7c56', // Nose
    M: '#5c3a21', // Beard/mouth
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
    O: '#b65e29', // Orange hair
    S: '#ecc3a7', // Skin
    W: '#ffffff', // Eye white
    G: '#5c8f2b', // Eye green
    N: '#d09674', // Nose
    L: '#d07474', // Lips
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
}

interface TransactionItem {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  timestamp: any;
  dateStr: string;
  userName: string;
  userUid: string;
  description: string;
  category: string;
}

interface LoadingOverlayProps {
  activeTheme: ThemeConfig;
}

function LoadingOverlay({ activeTheme }: LoadingOverlayProps) {
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
          <Animated.View style={[{ transform: [{ scale: pulseValue }], zIndex: 2 }]}>
            <Image 
              source={require('../../WhatsApp_Image_2026-06-05_at_19.30.05-removebg-preview.png')} 
              style={styles.loaderLogo}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View style={[styles.loaderSpinnerRing, { transform: [{ rotate: spin }], borderColor: 'rgba(255, 255, 255, 0.05)', borderTopColor: activeTheme.primaryColor }]} />
        </View>
        <Text style={[styles.loadingText, { color: activeTheme.primaryColor }]}>Securing Ledger Session...</Text>
      </View>
    </View>
  );
}

export default function AppIndex() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Dashboard & Analytics states
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  
  // Submit states
  const [amountInput, setAmountInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [typeInput, setTypeInput] = useState<'income' | 'expense'>('expense');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // User Sheet Modal states
  const [selectedUserSheet, setSelectedUserSheet] = useState<UserProfile | null>(null);
  const [modalTransactions, setModalTransactions] = useState<TransactionItem[]>([]);
  const [modalTotals, setModalTotals] = useState({ inflow: 0, outflow: 0, balance: 0 });

  const [activeThemeKey, setActiveThemeKey] = useState<string>('cyber_noir');
  const [dashboardTab, setDashboardTab] = useState<'dashboard' | 'activity' | 'accounts' | 'rewards' | 'profile'>('dashboard');

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const val = await AsyncStorage.getItem('app_theme');
        if (val && THEMES[val]) {
          setActiveThemeKey(val);
        }
      } catch (e) {
        console.warn("AsyncStorage theme loading failed:", e);
      }
    };
    loadTheme();
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
    // 1. Update active theme state instantly
    setActiveThemeKey(themeKey);

    // 2. Persist locally in AsyncStorage
    try {
      await AsyncStorage.setItem('app_theme', themeKey);
    } catch (e) {
      console.warn("AsyncStorage save theme failed:", e);
    }

    // 3. Persist globally in Firestore settings
    try {
      await setDoc(doc(db, 'settings', 'theme'), {
        activeTheme: themeKey,
        updatedBy: profile?.name || 'Admin',
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.warn("Global theme update failed in Firestore (using local theme instead):", err.message);
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
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
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

    const isAdmin = profile.role === 'ADMIN';

    if (isAdmin) {
      const activeListeners: (() => void)[] = [];
      const allTransactionsMap: { [uid: string]: TransactionItem[] } = {};

      const unsubscribeUsers = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
        const usersList: UserProfile[] = [];
        usersSnapshot.forEach((uDoc) => {
          usersList.push({ uid: uDoc.id, ...uDoc.data() } as UserProfile);
        });
        setAllUsers(usersList);

        // Reset previous individual user snapshot listeners
        activeListeners.forEach((unsub) => unsub());
        activeListeners.length = 0;

        usersSnapshot.forEach((uDoc) => {
          const empUid = uDoc.id;
          const uData = uDoc.data();
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
                  dateStr: data.timestamp ? new Date(data.timestamp.seconds * 1000).toISOString() : new Date().toISOString()
                } as TransactionItem);
              });
              allTransactionsMap[empUid] = empTrans;

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
          activeListeners.push(unsubEmp);
        });
      }, (error) => {
        console.error("Admin users list query failed: ", error);
      });

      return () => {
        unsubscribeUsers();
        activeListeners.forEach((unsub) => unsub());
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
            dateStr: data.timestamp ? new Date(data.timestamp.seconds * 1000).toISOString() : new Date().toISOString()
          } as TransactionItem);
        });
        list.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
        setAllTransactions(list);
      });
      return () => unsubscribe();
    }
  }, [profile]);

  // Auth Operations
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Input Error", "Please enter both email and password.");
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert("Authentication Failed", err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !fullName || !phone) {
      Alert.alert("Input Error", "Please fill in all registration fields.");
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
      
      const assignedRole = (email.trim().toLowerCase() === "jayyad71@gmail.com") ? "ADMIN" : "USER";
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
      Alert.alert("Success", "Account created successfully!");
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

  // Submit Transaction (supports offline queueing automatically)
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

      const descLower = descriptionInput.toLowerCase();
      let category = 'Other';
      if (descLower.includes('food') || descLower.includes('lunch') || descLower.includes('dinner') || descLower.includes('burger') || descLower.includes('dining')) {
        category = 'Dining';
      } else if (descLower.includes('travel') || descLower.includes('cab') || descLower.includes('uber') || descLower.includes('train') || descLower.includes('fuel')) {
        category = 'Travel';
      } else if (descLower.includes('bill') || descLower.includes('electricity') || descLower.includes('water') || descLower.includes('wifi')) {
        category = 'Utilities';
      }

      await addDoc(collection(db, collectionPath), {
        amount: Number(amountInput),
        type: typeInput,
        description: descriptionInput.trim(),
        category: category,
        timestamp: serverTimestamp(),
        createdBy: profile?.uid
      });

      setAmountInput('');
      setDescriptionInput('');
      Alert.alert("Submitted Successfully", "Your transaction has been logged.");
    } catch (err: any) {
      Alert.alert("Submission Failed", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

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
              Alert.alert("Success", "Transaction record deleted.");
            } catch (err: any) {
              Alert.alert("Failed to delete", err.message);
            }
          }
        }
      ]
    );
  };

  // Derived state for filtered transactions based on selected periodFilter
  const getFilteredTransactions = () => {
    const now = new Date();
    return allTransactions.filter(t => {
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
      return true; // 'all'
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  filteredTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }
  });
  const netBalance = totalIncome - totalExpense;

  // Modal handlers
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
  };

  const handleCloseUserSheet = () => {
    setSelectedUserSheet(null);
    setModalTransactions([]);
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!profile || profile.role !== 'ADMIN') {
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
              await deleteDoc(doc(db, "users", targetUid));
              Alert.alert("Success", "User account deleted successfully.");
              handleCloseUserSheet();
            } catch (err: any) {
              Alert.alert("Failed", err.message);
            }
          } 
        }
      ]
    );
  };

  // CSV Sheet Downloader (Web Compatible)
  const handleExportCSV = (userObj: UserProfile, trans: TransactionItem[]) => {
    if (Platform.OS !== 'web') {
      Alert.alert("Unsupported Platform", "Exporting sheets is supported on web browsers.");
      return;
    }
    try {
      const headers = ["Description", "Category", "Type", "Date / Time", "Amount (INR)"];
      const rows = trans.map(t => [
        t.description,
        t.category,
        t.type,
        new Date(t.dateStr).toLocaleString('en-IN'),
        t.amount
      ]);
      const csvContent = [headers, ...rows]
        .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
        
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
    } catch (err: any) {
      Alert.alert("Export Failed", err.message);
    }
  };

  // PDF Exporter (Web Compatible)
  const handleExportPDF = (userObj: UserProfile, trans: TransactionItem[]) => {
    if (Platform.OS !== 'web') {
      Alert.alert("Unsupported Platform", "Exporting to PDF is supported on web browsers.");
      return;
    }
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        Alert.alert("Pop-up Blocked", "Please allow pop-ups for this website to export PDFs.");
        return;
      }
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
            <td>${dateFormatted}</td>
            <td style="text-align: right; font-weight: 600; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">
              ${t.type === 'income' ? '+' : '-'} ₹${amt.toLocaleString('en-IN')}
            </td>
          </tr>
        `;
      });
      const balance = inflow - outflow;
      
      const htmlContent = `
        <html>
        <head>
          <title>Statement - ${userObj.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header-container { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0 0 5px 0; color: #0f172a; font-size: 2rem; font-weight: 800; }
            .subtitle { color: #64748b; font-size: 0.85rem; font-weight: 500; }
            .profile-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
            .profile-card h3 { margin: 0 0 8px 0; font-size: 1.1rem; color: #0f172a; }
            .profile-meta { color: #64748b; font-size: 0.85rem; }
            .metrics-grid { display: flex; gap: 20px; margin-bottom: 30px; }
            .metric-box { flex: 1; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
            .metric-box h4 { margin: 0 0 8px 0; font-size: 0.75rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
            .metric-val { margin: 0; font-size: 1.6rem; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
            th { background-color: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
            tr:hover { background-color: #f8fafc; }
            @media print {
              body { padding: 0; }
              .metric-box { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1>ADCS Ledger Statement</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleString('en-IN')}</div>
          </div>
          <div class="profile-card">
            <h3>${userObj.name}</h3>
            <div class="profile-meta">${userObj.email}</div>
          </div>
          <div class="metrics-grid">
            <div class="metric-box">
              <h4>Total Inflow</h4>
              <p class="metric-val" style="color: #10b981;">₹${inflow.toLocaleString('en-IN')}</p>
            </div>
            <div class="metric-box">
              <h4>Total Outflow</h4>
              <p class="metric-val" style="color: #ef4444;">₹${outflow.toLocaleString('en-IN')}</p>
            </div>
            <div class="metric-box">
              <h4>Net Balance</h4>
              <p class="metric-val" style="color: ${balance >= 0 ? '#10b981' : '#ef4444'}">₹${balance.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-top: 40px; margin-bottom: 15px;">Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Date / Time</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          <\/script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err: any) {
      Alert.alert("Export Failed", err.message);
    }
  };

  if (loading) {
    return <LoadingOverlay activeTheme={activeTheme} />;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: activeTheme.background }]}>
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

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {user && profile ? (
          <View style={styles.dashboardContainer}>
            
            {/* Header with Top-Left Logo / Custom Steve Head */}
            <View style={styles.dashboardHeader}>
              {activeThemeKey === 'minecraft_anime' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <SteveAvatar />
                  <View>
                    <Text style={[styles.welcomeText, { fontFamily: 'monospace', color: activeTheme.textColor, fontSize: 16, fontWeight: '700' }]}>Good Morning,</Text>
                    <Text style={[styles.welcomeText, { fontFamily: 'monospace', color: '#ffbb00', fontSize: 16, fontWeight: '800' }]}>{profile.name.split(' ')[0]}!</Text>
                  </View>
                </View>
              ) : (
                <Image 
                  source={require('../../WhatsApp_Image_2026-06-05_at_19.30.05-removebg-preview.png')} 
                  style={styles.dashboardLogo}
                  resizeMode="contain"
                />
              )}
              
              <View style={styles.headerUserSection}>
                {activeThemeKey === 'minecraft_anime' ? (
                  <Text style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: '800' }}>⚙️</Text>
                ) : (
                  <Text style={[styles.welcomeText, { color: activeTheme.textColor }]}>Welcome, {profile.name}</Text>
                )}
              </View>
            </View>

            {/* TAB CONTAINER CONTENT SWITCHER */}
            {dashboardTab === 'dashboard' && (
              <>
                {/* Dynamic Financial Summary Card (Arcade Scoreboard or Custom Minecraft Blue Card) */}
                {activeThemeKey === 'minecraft_anime' ? (
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
                      ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255, 0, 127, 0.2)', paddingTop: 10 }}>
                      <Text style={{ fontFamily: 'monospace', color: '#ff007f', fontSize: 11 }}>LIVES:</Text>
                      <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {Array.from({ length: 3 }).map((_, i) => (i < (netBalance > 0 ? 3 : netBalance === 0 ? 2 : 1) ? '💖' : '🖤')).join(' ')}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Default theme credit-card summary card
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
                )}

                {/* Minecraft 3D Send/Receive buttons row */}
                {activeThemeKey === 'minecraft_anime' && (
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    <TouchableOpacity 
                      style={{
                        flex: 1,
                        backgroundColor: '#5cbf3a',
                        borderWidth: 3,
                        borderColor: '#000000',
                        borderRadius: 8,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8,
                        shadowColor: '#2b7814',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                      }}
                      onPress={() => setTypeInput('expense')}
                    >
                      <Text style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: '800', color: '#ffffff', textShadowColor: '#000000', textShadowOffset: { width: 1.5, height: 1.5 }, textShadowRadius: 0 }}>Send</Text>
                      <Text style={{ fontSize: 16 }}>💎</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{
                        flex: 1,
                        backgroundColor: '#3abcc0',
                        borderWidth: 3,
                        borderColor: '#000000',
                        borderRadius: 8,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8,
                        shadowColor: '#1a7e82',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                      }}
                      onPress={() => setTypeInput('income')}
                    >
                      <Text style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: '800', color: '#ffffff', textShadowColor: '#000000', textShadowOffset: { width: 1.5, height: 1.5 }, textShadowRadius: 0 }}>Receive</Text>
                      <Text style={{ fontSize: 16 }}>🧈</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Featured Goals for Minecraft theme */}
                {activeThemeKey === 'minecraft_anime' && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: activeTheme.textColor }}>Featured Goals</Text>
                      <Text style={{ fontFamily: 'monospace', fontSize: 14, color: activeTheme.textMutedColor }}>&lt; &gt;</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                      <View style={{
                        width: 155,
                        backgroundColor: '#13223f',
                        borderWidth: 3,
                        borderColor: '#000000',
                        borderRadius: 8,
                        padding: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 0,
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontSize: 18 }}>💎</Text>
                          <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#3abcc0', fontWeight: '800' }}>17%</Text>
                        </View>
                        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#ffffff', fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>New Gaming PC</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 9, color: '#8a9bb5' }}>$350 / $2000</Text>
                        <View style={{ height: 6, backgroundColor: '#0b1627', borderRadius: 0, borderWidth: 1, borderColor: '#000', marginTop: 8 }}>
                          <View style={{ width: '17%', height: '100%', backgroundColor: '#5cbf3a' }} />
                        </View>
                      </View>

                      <View style={{
                        width: 155,
                        backgroundColor: '#13223f',
                        borderWidth: 3,
                        borderColor: '#000000',
                        borderRadius: 8,
                        padding: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 0,
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontSize: 18 }}>🗺️</Text>
                          <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#3abcc0', fontWeight: '800' }}>24%</Text>
                        </View>
                        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#ffffff', fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>Holiday Trip</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 9, color: '#8a9bb5' }}>$1200 / $5000</Text>
                        <View style={{ height: 6, backgroundColor: '#0b1627', borderRadius: 0, borderWidth: 1, borderColor: '#000', marginTop: 8 }}>
                          <View style={{ width: '24%', height: '100%', backgroundColor: '#3abcc0' }} />
                        </View>
                      </View>

                      <View style={{
                        width: 155,
                        backgroundColor: '#13223f',
                        borderWidth: 3,
                        borderColor: '#000000',
                        borderRadius: 8,
                        padding: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 0,
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontSize: 18 }}>⛏️</Text>
                          <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#3abcc0', fontWeight: '800' }}>50%</Text>
                        </View>
                        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#ffffff', fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>Crypto Mining</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 9, color: '#8a9bb5' }}>$500 / $1090</Text>
                        <View style={{ height: 6, backgroundColor: '#0b1627', borderRadius: 0, borderWidth: 1, borderColor: '#000', marginTop: 8 }}>
                          <View style={{ width: '50%', height: '100%', backgroundColor: '#5cbf3a' }} />
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                )}

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
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Log New Transaction</Text>
                  <View style={styles.form}>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: activeTheme.inputBackground, 
                          borderColor: activeTheme.inputBorder, 
                          borderWidth: activeTheme.borderWidth || 1,
                          borderRadius: activeTheme.borderRadius, 
                          color: activeTheme.textColor,
                          fontFamily: activeTheme.fontFamily || 'System'
                        }
                      ]}
                      placeholder="Description (e.g., Office Supplies)"
                      placeholderTextColor={activeTheme.textMutedColor}
                      value={descriptionInput}
                      onChangeText={setDescriptionInput}
                    />

                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: activeTheme.inputBackground, 
                          borderColor: activeTheme.inputBorder, 
                          borderWidth: activeTheme.borderWidth || 1,
                          borderRadius: activeTheme.borderRadius, 
                          color: activeTheme.textColor,
                          fontFamily: activeTheme.fontFamily || 'System'
                        }
                      ]}
                      placeholder="Amount (INR)"
                      placeholderTextColor={activeTheme.textMutedColor}
                      keyboardType="numeric"
                      value={amountInput}
                      onChangeText={setAmountInput}
                    />

                    <View style={styles.toggleRow}>
                      <TouchableOpacity 
                        style={[
                          styles.toggleBtn, 
                          { 
                            borderRadius: activeTheme.borderRadius, 
                            borderWidth: activeTheme.borderWidth || 1,
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
                          {activeThemeKey === 'minecraft_anime' ? 'Send 💎' : 'Expense'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.toggleBtn, 
                          { 
                            borderRadius: activeTheme.borderRadius, 
                            borderWidth: activeTheme.borderWidth || 1,
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
                          {activeThemeKey === 'minecraft_anime' ? 'Receive 🧱' : 'Income'}
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
                      onPress={handleSubmitExpense}
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
                        ]}>Submit Transaction</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Admin Global Theme Picker Grid */}
                {profile.role === 'ADMIN' && (
                  <View style={[
                    styles.card, 
                    { 
                      backgroundColor: activeTheme.cardBackground, 
                      borderColor: activeTheme.cardBorder, 
                      borderRadius: activeTheme.borderRadius,
                      borderWidth: activeTheme.borderWidth || 1
                    }
                  ]}>
                    <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>🎨 Admin Settings - Global Theme Selector</Text>
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
                                borderWidth: activeTheme.borderWidth || 1,
                                borderColor: isActive ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)' 
                              },
                              isActive && { backgroundColor: activeTheme.primaryColor + '12' }
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
                  </View>
                )}
              </>
            )}

            {dashboardTab === 'activity' && (
              <>
                {/* Allover Expense Filter Period Tabs */}
                <View style={styles.filterContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => {
                      const isActive = periodFilter === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.filterBtn,
                            { 
                              borderRadius: activeTheme.borderRadius, 
                              borderWidth: activeTheme.borderWidth || 1,
                              borderColor: isActive ? activeTheme.primaryColor : 'rgba(255, 255, 255, 0.05)' 
                            },
                            isActive && { backgroundColor: activeTheme.primaryColor === '#ffffff' ? '#ffffff' : activeTheme.primaryColor + '18' }
                          ]}
                          onPress={() => setPeriodFilter(p)}
                        >
                          <Text style={[
                            styles.filterBtnText,
                            { 
                              color: isActive ? (activeTheme.primaryColor === '#ffffff' ? '#000000' : activeTheme.primaryColor) : activeTheme.textMutedColor,
                              fontFamily: activeTheme.fontFamily || 'System'
                            }
                          ]}>
                            {p.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* TRANSACTIONS SYNC LEDGER */}
                <View style={[
                  styles.card, 
                  { 
                    backgroundColor: activeTheme.cardBackground, 
                    borderColor: activeTheme.cardBorder, 
                    borderRadius: activeTheme.borderRadius,
                    borderWidth: activeTheme.borderWidth || 1
                  }
                ]}>
                  <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Recent Logged Transactions</Text>
                  {filteredTransactions.length === 0 ? (
                    <Text style={styles.emptyText}>No transactions recorded.</Text>
                  ) : (
                    filteredTransactions.map(item => (
                      <View key={item.id} style={[styles.ledgerRow, { borderBottomColor: activeTheme.inputBorder }]}>
                        <View style={styles.ledgerLeftRow}>
                          <View style={[styles.ledgerCategoryIconBg, { backgroundColor: activeTheme.inputBackground, borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.borderWidth || 1, borderColor: activeTheme.cardBorder }]}>
                            <Text style={styles.ledgerCategoryIcon}>
                              {activeThemeKey === 'minecraft_anime' ? (
                                (() => {
                                  const desc = item.description.toLowerCase();
                                  if (desc.includes('steam') || desc.includes('game') || desc.includes('play')) return '🎮';
                                  if (desc.includes('salary') || desc.includes('income') || desc.includes('pay') || desc.includes('earn')) return '📦';
                                  if (desc.includes('coffee') || desc.includes('cafe') || desc.includes('tea') || desc.includes('starbucks')) return '☕';
                                  if (desc.includes('minecoin') || desc.includes('emerald') || desc.includes('gem')) return '🟢';
                                  if (item.type === 'income') return '💎';
                                  return '🧱';
                                })()
                              ) : (
                                item.type === 'income' ? '📈' : (CATEGORY_ICONS[item.category] || '📦')
                              )}
                            </Text>
                          </View>
                          <View style={styles.ledgerLeft}>
                            <Text style={[styles.ledgerId, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>{item.description}</Text>
                            <View style={styles.ledgerSubRow}>
                              <Text style={[styles.ledgerTime, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                                {new Date(item.dateStr).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                              {profile.role === 'ADMIN' && item.userName && (
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
                                  <Text style={[styles.ledgerUserLink, { color: activeTheme.primaryColor, fontFamily: activeTheme.fontFamily || 'System' }]}>• {item.userName}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                        <View style={styles.ledgerRight}>
                          <Text style={[
                            styles.ledgerAmount, 
                            { 
                              color: item.type === 'income' ? activeTheme.incomeColor : activeTheme.expenseColor,
                              fontFamily: activeTheme.fontFamily || 'System'
                            }
                          ]}>
                            {item.type === 'income' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                          </Text>
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
                {/* ADMIN DIRECTORY LIST (Outflow Spending) */}
                {profile.role === 'ADMIN' ? (
                  <View style={[
                    styles.card, 
                    { 
                      backgroundColor: activeTheme.cardBackground, 
                      borderColor: activeTheme.cardBorder, 
                      borderRadius: activeTheme.borderRadius,
                      borderWidth: activeTheme.borderWidth || 1
                    }
                  ]}>
                    <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Admin Directory - Outflow Spending</Text>
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

                        // Percent relative to total outflow
                        const pct = totalExpense > 0 ? (totalSpent / totalExpense) * 100 : 0;

                        return (
                          <TouchableOpacity
                            key={u.uid}
                            style={[styles.teamMemberItem, { borderBottomColor: activeTheme.inputBorder }]}
                            onPress={() => handleOpenUserSheet(u)}
                          >
                            <View style={styles.teamMemberInfo}>
                              <View style={[styles.teamMemberAvatar, { backgroundColor: activeTheme.primaryColor, borderRadius: activeTheme.borderRadius }]}>
                                <Text style={[styles.avatarText, { color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff', fontFamily: activeTheme.fontFamily || 'System' }]}>
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </Text>
                              </View>
                              <View>
                                <Text style={[styles.teamMemberName, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>{u.name || 'Unknown'}</Text>
                              </View>
                            </View>
                            <View style={styles.teamMemberSpending}>
                              <Text style={[styles.spendingLabel, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Total Outflow</Text>
                              <Text style={[styles.spendingVal, { color: activeTheme.expenseColor, fontFamily: activeTheme.fontFamily || 'System' }]}>₹{totalSpent.toLocaleString('en-IN')}</Text>
                              
                              {/* Spending Indicator progress track */}
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
                  <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.cardBorder, borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.borderWidth || 1, padding: 20 }]}>
                    <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Directory Restricted</Text>
                    <Text style={{ color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 13 }}>
                      The members list directory is restricted to Administrators only. Use the Dashboard tab to view and log personal spending accounts.
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
                <Text style={[styles.cardHeader, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System', marginBottom: 12 }]}>🏆 Retro Achievements & Milestones</Text>
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
                          borderWidth: activeTheme.borderWidth || 1,
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

            {dashboardTab === 'profile' && (
              <>
                <View style={[
                  styles.card, 
                  { 
                    backgroundColor: activeTheme.cardBackground, 
                    borderColor: activeTheme.cardBorder, 
                    borderRadius: activeTheme.borderRadius,
                    borderWidth: activeTheme.borderWidth || 1,
                    padding: 20
                  }
                ]}>
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ marginBottom: 10 }}>
                      {activeThemeKey === 'minecraft_anime' ? <AlexAvatar /> : <Text style={{ fontSize: 36 }}>👤</Text>}
                    </View>
                    <Text style={[styles.welcomeText, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 18 }]}>{profile.name}</Text>
                    <Text style={{ color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12, marginTop: 4 }}>{profile.email}</Text>
                  </View>
                  
                  <View style={[styles.summaryDivider, { backgroundColor: activeTheme.inputBorder }]} />
                  
                  <View style={{ gap: 10, marginVertical: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12 }}>ROLE</Text>
                      <Text style={{ color: activeTheme.primaryColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12, fontWeight: '700' }}>{profile.role}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12 }}>EMPLOYEE ID</Text>
                      <Text style={{ color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12, fontWeight: '600' }}>{profile.employeeId || 'N/A'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12 }}>PHONE</Text>
                      <Text style={{ color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12 }}>{profile.phone || 'N/A'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12 }}>JOIN DATE</Text>
                      <Text style={{ color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System', fontSize: 12 }}>
                        {new Date(profile.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={[styles.logoutBtn, { borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.isRetro ? activeTheme.borderWidth || 3 : 1, borderColor: activeTheme.isRetro ? '#000000' : 'rgba(239, 68, 68, 0.3)' }]} onPress={handleLogout}>
                  <Text style={[styles.logoutText, { fontFamily: activeTheme.fontFamily || 'System', textTransform: activeTheme.isRetro ? 'uppercase' : 'none' }]}>Secure Logout</Text>
                </TouchableOpacity>
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
              <Text style={[styles.brandSubtitle, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System', textTransform: activeTheme.isRetro ? 'uppercase' : 'none' }]}>Secure Financial Ledger Portal</Text>
            </View>

            {/* Segmented Tab Controls */}
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
                    textTransform: activeTheme.isRetro ? 'uppercase' : 'none'
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
                    textTransform: activeTheme.isRetro ? 'uppercase' : 'none'
                  }
                ]}>Register</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'signin' ? (
              // EMAIL/PASSWORD SIGN IN FORM
              <View style={styles.form}>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: activeTheme.inputBackground, 
                      borderColor: activeTheme.inputBorder, 
                      borderWidth: activeTheme.borderWidth || 1,
                      borderRadius: activeTheme.borderRadius, 
                      color: activeTheme.textColor,
                      fontFamily: activeTheme.fontFamily || 'System'
                    }
                  ]}
                  placeholder="Email Address"
                  placeholderTextColor={activeTheme.textMutedColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: activeTheme.inputBackground, 
                      borderColor: activeTheme.inputBorder, 
                      borderWidth: activeTheme.borderWidth || 1,
                      borderRadius: activeTheme.borderRadius, 
                      color: activeTheme.textColor,
                      fontFamily: activeTheme.fontFamily || 'System'
                    }
                  ]}
                  placeholder="Security Password"
                  placeholderTextColor={activeTheme.textMutedColor}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
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
                  onPress={handleSignIn}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color={activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff'} />
                  ) : (
                    <Text style={[
                      styles.submitBtnText, 
                      { 
                        color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff',
                        fontFamily: activeTheme.fontFamily || 'System',
                        textTransform: activeTheme.isRetro ? 'uppercase' : 'none'
                      }
                    ]}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // USER/EMPLOYEE REGISTRATION FORM
              <View style={styles.form}>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: activeTheme.inputBackground, 
                      borderColor: activeTheme.inputBorder, 
                      borderWidth: activeTheme.borderWidth || 1,
                      borderRadius: activeTheme.borderRadius, 
                      color: activeTheme.textColor,
                      fontFamily: activeTheme.fontFamily || 'System'
                    }
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor={activeTheme.textMutedColor}
                  value={fullName}
                  onChangeText={setFullName}
                />
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: activeTheme.inputBackground, 
                      borderColor: activeTheme.inputBorder, 
                      borderWidth: activeTheme.borderWidth || 1,
                      borderRadius: activeTheme.borderRadius, 
                      color: activeTheme.textColor,
                      fontFamily: activeTheme.fontFamily || 'System'
                    }
                  ]}
                  placeholder="Email Address"
                  placeholderTextColor={activeTheme.textMutedColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: activeTheme.inputBackground, 
                      borderColor: activeTheme.inputBorder, 
                      borderWidth: activeTheme.borderWidth || 1,
                      borderRadius: activeTheme.borderRadius, 
                      color: activeTheme.textColor,
                      fontFamily: activeTheme.fontFamily || 'System'
                    }
                  ]}
                  placeholder="Phone Number"
                  placeholderTextColor={activeTheme.textMutedColor}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: activeTheme.inputBackground, 
                      borderColor: activeTheme.inputBorder, 
                      borderWidth: activeTheme.borderWidth || 1,
                      borderRadius: activeTheme.borderRadius, 
                      color: activeTheme.textColor,
                      fontFamily: activeTheme.fontFamily || 'System'
                    }
                  ]}
                  placeholder="Security Password"
                  placeholderTextColor={activeTheme.textMutedColor}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                
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
                  onPress={handleRegister}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color={activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff'} />
                  ) : (
                    <Text style={[
                      styles.submitBtnText, 
                      { 
                        color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff',
                        fontFamily: activeTheme.fontFamily || 'System',
                        textTransform: activeTheme.isRetro ? 'uppercase' : 'none'
                      }
                    ]}>Register & Activate</Text>
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
          }
        ]}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: activeThemeKey === 'minecraft_anime' ? '💎' : activeThemeKey === 'brick_breaker' ? '🕹️' : '📊' },
            { key: 'activity', label: 'Activity', icon: activeThemeKey === 'minecraft_anime' ? '⚔️' : activeThemeKey === 'brick_breaker' ? '👾' : '📈' },
            { key: 'accounts', label: 'Accounts', icon: activeThemeKey === 'minecraft_anime' ? '📦' : activeThemeKey === 'brick_breaker' ? '🧱' : '👥' },
            { key: 'rewards', label: 'Rewards', icon: activeThemeKey === 'minecraft_anime' ? '🧪' : activeThemeKey === 'brick_breaker' ? '🏆' : '✨' },
            { key: 'profile', label: 'profile', icon: 'profile_avatar' }
          ].map((tab) => {
            const isActive = dashboardTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.bottomTabBtn,
                  isActive && (activeThemeKey === 'minecraft_anime' ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {})
                ]}
                onPress={() => setDashboardTab(tab.key as any)}
              >
                {tab.icon === 'profile_avatar' ? (
                  activeThemeKey === 'minecraft_anime' ? (
                    <View style={{ width: 22, height: 22, borderWidth: 1.5, borderColor: '#000000', backgroundColor: '#ecc3a7', overflow: 'hidden' }}>
                      <AlexAvatar />
                    </View>
                  ) : (
                    <Text style={[styles.bottomTabIcon, isActive && { color: activeTheme.primaryColor }]}>👤</Text>
                  )
                ) : (
                  <Text style={[styles.bottomTabIcon, isActive && { color: activeTheme.primaryColor }]}>{tab.icon}</Text>
                )}
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
          })}
        </View>
      )}

      {/* USER STATEMENT SHEET MODAL */}
      <Modal
        visible={selectedUserSheet !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseUserSheet}
      >
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
                <Text style={[styles.modalTitle, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>{selectedUserSheet?.name}'s Spending Sheet</Text>
                <Text style={[styles.modalSubtitle, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                  {selectedUserSheet?.email}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseUserSheet} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Metrics Grid */}
            <View style={styles.modalMetrics}>
              <View style={[styles.modalMetricCard, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.borderWidth || 1 }]}>
                <Text style={[styles.metricLabel, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Total Inflow</Text>
                <Text style={[styles.metricVal, { color: activeTheme.incomeColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                  ₹{modalTotals.inflow.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.modalMetricCard, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.borderWidth || 1 }]}>
                <Text style={[styles.metricLabel, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Total Outflow</Text>
                <Text style={[styles.metricVal, { color: activeTheme.expenseColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                  ₹{modalTotals.outflow.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.modalMetricCard, { backgroundColor: activeTheme.inputBackground, borderColor: activeTheme.inputBorder, borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.borderWidth || 1 }]}>
                <Text style={[styles.metricLabel, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Net Balance</Text>
                <Text style={[styles.metricVal, { color: modalTotals.balance >= 0 ? activeTheme.incomeColor : activeTheme.expenseColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                  ₹{modalTotals.balance.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Admin Sheets / PDF Export Actions */}
            <View style={styles.exportActionsRow}>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: activeTheme.primaryColor, borderWidth: activeTheme.isRetro ? activeTheme.borderWidth || 2 : 0, borderColor: activeTheme.cardBorder }]} 
                onPress={() => handleExportCSV(selectedUserSheet!, modalTransactions)}
              >
                <Text style={[styles.exportBtnText, { color: activeTheme.primaryColor === '#ffffff' ? '#000000' : '#ffffff', fontFamily: activeTheme.fontFamily || 'System' }]}>Sheets (CSV)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: '#059669', borderWidth: activeTheme.isRetro ? activeTheme.borderWidth || 2 : 0, borderColor: activeTheme.cardBorder }]} 
                onPress={() => handleExportCSV(selectedUserSheet!, modalTransactions)}
              >
                <Text style={[styles.exportBtnText, { fontFamily: activeTheme.fontFamily || 'System' }]}>Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: '#dc2626', borderWidth: activeTheme.isRetro ? activeTheme.borderWidth || 2 : 0, borderColor: activeTheme.cardBorder }]} 
                onPress={() => handleExportPDF(selectedUserSheet!, modalTransactions)}
              >
                <Text style={[styles.exportBtnText, { fontFamily: activeTheme.fontFamily || 'System' }]}>Export PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Transactions Scroll */}
            <Text style={[sectionHeaderStyle, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>Transaction History</Text>
            <ScrollView style={styles.modalScroll}>
              {modalTransactions.length === 0 ? (
                <Text style={styles.emptyText}>No transaction records found.</Text>
              ) : (
                modalTransactions.map((t) => (
                  <View key={t.id} style={[styles.modalLedgerRow, { borderBottomColor: activeTheme.inputBorder }]}>
                    <View>
                      <Text style={[styles.ledgerId, { color: activeTheme.textColor, fontFamily: activeTheme.fontFamily || 'System' }]}>{t.description}</Text>
                      <Text style={[styles.ledgerTime, { color: activeTheme.textMutedColor, fontFamily: activeTheme.fontFamily || 'System' }]}>
                        {new Date(t.dateStr).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={[
                      styles.ledgerAmount,
                      { color: t.type === 'income' ? activeTheme.incomeColor : activeTheme.expenseColor, fontFamily: activeTheme.fontFamily || 'System' }
                    ]}>
                      {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Delete User Section */}
            {profile?.role === 'ADMIN' && selectedUserSheet?.uid !== profile?.uid && (
              <TouchableOpacity
                style={[styles.deleteUserBtn, { borderRadius: activeTheme.borderRadius, borderWidth: activeTheme.isRetro ? activeTheme.borderWidth || 2 : 1, borderColor: '#ef4444' }]}
                onPress={() => handleDeleteUser(selectedUserSheet?.uid || '')}
              >
                <Text style={[styles.deleteUserBtnText, { fontFamily: activeTheme.fontFamily || 'System', textTransform: activeTheme.isRetro ? 'uppercase' : 'none' }]}>Permanently Remove User Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Inline style parameter workarounds for React Native
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
    padding: 20,
    width: '100%',
    maxWidth: 550, // Constrain width on wide screens!
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
  authCard: {
    backgroundColor: '#0e111a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  brandContainer: {
    alignItems: 'center',
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
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  tabActiveText: {
    color: '#fff',
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
  filterBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  filterBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  filterBtnTextActive: {
    color: '#6366f1',
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
  toggleActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  toggleText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#6366f1',
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
  ledgerUserLink: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
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
  themeSelectorGrid: {
    gap: 10,
  },
  themeSelectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
  },
  themeSelectorBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
});
