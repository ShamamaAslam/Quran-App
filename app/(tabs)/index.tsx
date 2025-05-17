
import React, { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, TextInput, Alert, Switch, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabase'; 


// Define types for our data structures
type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
};

type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
  audio?: string;
};

type Translation = {
  number: number;
  text: string;
};

type Tafseer = {
  number: number;
  text: string;
};

type AppContextType = {
  screen: string;
  setScreen: (screen: string) => void;
  surahs: Surah[];
  ayahs: Ayah[];
  translations: Translation[];
  tafseer: Tafseer[];
  selectedSurah: Surah | null;
  setSelectedSurah: (surah: Surah | null) => void;
  selectedAyah: number | null;
  setSelectedAyah: (ayah: number | null) => void;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredSurahs: Surah[];
  translationLanguage: string;
  displaySettings: {
    showArabic: boolean;
    showTranslation: boolean;
    showTafseer: boolean;
  };
  updateDisplaySettings: (settings: Partial<{
    showArabic: boolean;
    showTranslation: boolean;
    showTafseer: boolean;
  }>) => void;
  saveData: (key: string, data: any) => Promise<void>;
  loadData: (key: string) => Promise<any>;
  handleSearch: (query: string) => void;
  fetchSurahs: () => Promise<void>;
  fetchAyahs: (surahNumber: number) => Promise<void>;
  fetchTranslations: (surahNumber: number) => Promise<void>;
  fetchTafseer: (surahNumber: number) => Promise<void>;
  changeTranslation: (newLanguage: string) => void;
  isPlaying: boolean;
  currentAyah: number | null;
  playAyah: (ayahNumber: number, audioUrl: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  loadNextSurah: () => void;
  loadPreviousSurah: () => void;
  currentSurahIndex: number;
};

// Create Context with default values
export const AppContext = createContext<AppContextType>({
  screen: 'home',
  setScreen: () => {},
  surahs: [],
  ayahs: [],
  translations: [],
  tafseer: [],
  selectedSurah: null,
  setSelectedSurah: () => {},
  selectedAyah: null,
  setSelectedAyah: () => {},
  loading: false,
  error: null,
  searchQuery: '',
  setSearchQuery: () => {},
  filteredSurahs: [],
  translationLanguage: 'en.sahih',
  displaySettings: {
    showArabic: true,
    showTranslation: true,
    showTafseer: false,
  },
  updateDisplaySettings: () => {},
  saveData: async () => {},
  loadData: async () => null,
  handleSearch: () => {},
  fetchSurahs: async () => {},
  fetchAyahs: async () => {},
  fetchTranslations: async () => {},
  fetchTafseer: async () => {},
  changeTranslation: () => {},
  isPlaying: false,
  currentAyah: null,
  playAyah: async () => {},
  pauseAudio: async () => {},
  loadNextSurah: () => {},
  loadPreviousSurah: () => {},
  currentSurahIndex: 0
});

// App Provider Component
const AppProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState('home');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [tafseer, setTafseer] = useState<Tafseer[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [translationLanguage, setTranslationLanguage] = useState('en.sahih');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [currentSurahIndex, setCurrentSurahIndex] = useState(0);
  const [displaySettings, setDisplaySettings] = useState({
    showArabic: true,
    showTranslation: true,
    showTafseer: false,
  });

  // Load saved display settings on startup
  useEffect(() => {
    (async () => {
      try {
        const savedSettings = await loadData('displaySettings');
        if (savedSettings) {
          setDisplaySettings(savedSettings);
        }
      } catch (error) {
        console.error('Failed to load display settings:', error);
      }
    })();
  }, []);

  const updateDisplaySettings = async (settings: Partial<{
    showArabic: boolean;
    showTranslation: boolean;
    showTafseer: boolean;
  }>) => {
    const newSettings = { ...displaySettings, ...settings };
    setDisplaySettings(newSettings);
    await saveData('displaySettings', newSettings);
  };

  const showError = (message: string) => {
    Alert.alert('Error', message);
    setError(message);
  };

  const saveData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      showError('Failed to save data locally');
    }
  };

  const loadData = async (key: string) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      showError('Failed to load saved data');
      return null;
    }
  };

  const playAyah = async (ayahNumber: number, audioUrl: string) => {
    try {
      // Stop any currently playing audio
      if (sound) {
        await sound.unloadAsync();
      }
      // Play the new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      setCurrentAyah(ayahNumber);
      // When playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentAyah(null);
          // Auto-play next ayah
          const nextAyahIndex = ayahs.findIndex(a => a.numberInSurah === ayahNumber) + 1;
          if (nextAyahIndex < ayahs.length) {
            const nextAyah = ayahs[nextAyahIndex];
            playAyah(nextAyah.numberInSurah, nextAyah.audio || '');
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      showError('Failed to play audio');
    }
  };
  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };
  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadNextSurah = () => {
    if (surahs.length === 0) return;
    
    const nextIndex = (currentSurahIndex + 1) % surahs.length; // Circular navigation
    setCurrentSurahIndex(nextIndex);
    const nextSurah = surahs[nextIndex];
    setSelectedSurah(nextSurah);
    fetchAyahs(nextSurah.number);
    fetchTranslations(nextSurah.number);
    if (displaySettings.showTafseer) {
      fetchTafseer(nextSurah.number);
    }
  };

  const loadPreviousSurah = () => {
    if (surahs.length === 0) return;
    
    const prevIndex = (currentSurahIndex - 1 + surahs.length) % surahs.length; // Circular navigation
    setCurrentSurahIndex(prevIndex);
    const prevSurah = surahs[prevIndex];
    setSelectedSurah(prevSurah);
    fetchAyahs(prevSurah.number);
    fetchTranslations(prevSurah.number);
    if (displaySettings.showTafseer) {
      fetchTafseer(prevSurah.number);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilteredSurahs(
      query === '' 
        ? surahs 
        : surahs.filter(surah =>
            surah.englishName.toLowerCase().includes(query.toLowerCase()) ||
            (surah.englishNameTranslation && 
             surah.englishNameTranslation.toLowerCase().includes(query.toLowerCase())) ||
            surah.name.toLowerCase().includes(query.toLowerCase())
          )
    );
  };

  const fetchSurahs = async () => {

const surahdatafetch = async ()=>{
  let { data: Surahs, error } = await supabase.from('Surahs').select('*')
if(error){
  console.log(error)
}
console.log('Supabase Database Data == ',Surahs)
}
surahdatafetch();


    setLoading(true);
    setError(null);
    try {
      const cachedSurahs = await loadData('surahs');
      if (cachedSurahs && cachedSurahs.length > 0) {
        setSurahs(cachedSurahs);
        setFilteredSurahs(cachedSurahs);
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.alquran.cloud/v1/surah');
      if (!response.ok) throw new Error('Failed to fetch surahs');
      
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) throw new Error('Invalid surah data');
      
      const newSurahs = data.data;
      setSurahs(newSurahs);
      setFilteredSurahs(newSurahs);
      await saveData('surahs', newSurahs);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load surahs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAyahs = async (surahNumber: number) => {
    if (!surahNumber) return;
    
    setLoading(true);
    setError(null);
    try {
      const cachedKey = `surah-${surahNumber}`;
      const cachedAyahs = await loadData(cachedKey);
      
      if (cachedAyahs && cachedAyahs.length > 0) {
        setAyahs(cachedAyahs);
        setLoading(false);
        return;
      }
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`);
      if (!response.ok) throw new Error('Failed to fetch ayahs');
      
      const data = await response.json();
      if (!data.data || !data.data.ayahs) throw new Error('Invalid ayah data');
      
      // Use the audio URLs provided by the API instead of constructing them
      const ayahsData = data.data.ayahs.map((ayah: any) => ({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
        audio: ayah.audio // Use the audio URL from the API response
      }));
      
      setAyahs(ayahsData);
      await saveData(cachedKey, ayahsData);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load ayahs');
    } finally {
      setLoading(false);
    }
  };

  const fetchTranslations = async (surahNumber: number) => {
    if (!surahNumber) return;
    
    setLoading(true);
    setError(null);
    try {
      const cachedKey = `translation-${surahNumber}-${translationLanguage}`;
      const cachedTranslations = await loadData(cachedKey);
      
      if (cachedTranslations && cachedTranslations.length > 0) {
        setTranslations(cachedTranslations);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/${translationLanguage}`
      );
      if (!response.ok) throw new Error('Failed to fetch translations');
      
      const data = await response.json();
      if (!data.data || !data.data.ayahs) throw new Error('Invalid translation data');
      
      const translationsData = data.data.ayahs;
      setTranslations(translationsData);
      await saveData(cachedKey, translationsData);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  };
  // Fetch Tafseer data
  const fetchTafseer = async (surahNumber: number) => {
    if (!surahNumber) return;
    
    // Only fetch tafseer if it's enabled in display settings
    if (!displaySettings.showTafseer) return;
    
    setLoading(true);
    setError(null);
    try {
      // We'll use Tafsir Ibn Kathir in Urdu, which corresponds to id 158 in the API
      const tafseerID = 158; // Ibn Kathir Urdu
      const cachedKey = `tafseer-${surahNumber}-${tafseerID}`;
      
      const cachedTafseer = await loadData(cachedKey);
      if (cachedTafseer && cachedTafseer.length > 0) {
        setTafseer(cachedTafseer);
        setLoading(false);
        return;
      }

      // Using Tafsir API to get Urdu tafseer
      const response = await fetch(
        `https://quranenc.com/api/v1/translation/sura/urdu_junagarhi/${surahNumber}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch tafseer');
      
      const data = await response.json();
      if (!data.result) throw new Error('Invalid tafseer data');
      
      const tafseerData = data.result.map((ayah: any) => ({
        number: ayah.aya,
        text: ayah.translation
      }));
      
      setTafseer(tafseerData);
      await saveData(cachedKey, tafseerData);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load tafseer');
      // Set empty tafseer to avoid continuous failed attempts
      setTafseer([]);
    } finally {
      setLoading(false);
    }
  };

  const changeTranslation = (newLanguage: string) => {
    setTranslationLanguage(newLanguage);
    if (screen.startsWith('surah-')) {
      const surahNumber = parseInt(screen.split('-')[1]);
      fetchTranslations(surahNumber);
    }
  };

  const contextValue: AppContextType = {
    screen,
    setScreen,
    surahs,
    ayahs,
    translations,
    tafseer,
    selectedSurah,
    setSelectedSurah,
    selectedAyah,
    setSelectedAyah,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filteredSurahs,
    translationLanguage,
    displaySettings,
    updateDisplaySettings,
    saveData,
    loadData,
    handleSearch,
    fetchSurahs,
    fetchAyahs,
    fetchTranslations,
    fetchTafseer,
    changeTranslation,
    isPlaying,
    currentAyah,
    playAyah,
    pauseAudio,
    loadNextSurah,
    loadPreviousSurah,
    currentSurahIndex
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Home Screen Component
const HomeScreen = () => {
  const {
    setScreen,
    fetchSurahs
  } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Image
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Quran_Kareem.svg/1200px-Quran_Kareem.svg.png' }}
          style={styles.quranIcon}
        />
        <Text style={styles.title}>Quran App</Text>
      </View>
      <Image
        source={{ uri: 'https://as2.ftcdn.net/v2/jpg/07/04/62/61/1000_F_704626128_OhKu8DvcgPFdYeR8htXlVGAfK15nxuda.jpg' }}
        style={styles.additionalImage}
      />
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              setScreen('surahs');
              fetchSurahs();
            }}
          >
            <Text style={styles.buttonText}>📖 Read Quran</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => setScreen('settings')}
          >
            <Text style={styles.buttonText}>⚙ Settings</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Bookmark feature coming soon')}>
            <Text style={styles.buttonText}>🔖 Bookmark</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Search feature coming soon')}>
            <Text style={styles.buttonText}>🔍 Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Surah List Screen Component
const SurahListScreen = () => {
  const {
    setScreen,
    loading,
    error,
    searchQuery,
    filteredSurahs,
    setSelectedSurah,
    handleSearch,
    fetchSurahs
  } = useContext(AppContext);

  const renderSurahItem = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={styles.surahItem}
      onPress={() => {
        setSelectedSurah(item);
        setScreen(`surah-${item.number}`);
      }}
    >
      <Text style={styles.surahNumber}>{item.number}.</Text>
      <View style={styles.surahTextContainer}>
        <Text style={styles.surahName}>{item.englishName}</Text>
        <Text style={styles.surahTranslation}>{item.englishNameTranslation}</Text>
        <Text style={styles.surahRevelation}>{item.revelationType}</Text>
      </View>
      <Text style={styles.surahNameArabic}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.surahListContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setScreen('home')}>
        <Text style={styles.backButtonText}>⬅ Back</Text>
      </TouchableOpacity>
      <Text style={styles.screenTitle}>Surahs</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search Surahs..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSurahs}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && filteredSurahs.length === 0 ? (
        <ActivityIndicator size="large" color="#344D92" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={item => item.number.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.noResultsText}>No surahs found</Text>
          }
        />
      )}
    </View>
  );
};
// Ayah Screen Component
const AyahScreen = () => {
  const {
    setScreen,
    loading,
    error,
    ayahs,
    translations,
    tafseer,
    selectedSurah,
    selectedAyah,
    setSelectedAyah,
    translationLanguage,
    displaySettings,
    fetchAyahs,
    fetchTranslations,
    fetchTafseer,
    changeTranslation,
    isPlaying,
    currentAyah,
    playAyah,
    pauseAudio,
    loadNextSurah,
    loadPreviousSurah,
    currentSurahIndex,
    surahs
  } = useContext(AppContext);

  useEffect(() => {
    if (selectedSurah?.number) {
      fetchAyahs(selectedSurah.number);
      fetchTranslations(selectedSurah.number);
      
      if (displaySettings.showTafseer) {
        fetchTafseer(selectedSurah.number);
      }
    }
  }, [selectedSurah?.number, translationLanguage, displaySettings.showTafseer]);

  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    // Detect scroll to bottom
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom) {
      loadNextSurah();
    }
  };

  // Pull-to-refresh handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    loadPreviousSurah();
    setRefreshing(false);
  };

  const renderAyahItem = ({ item, index }: { item: Ayah, index: number }) => (
    <TouchableOpacity onPress={() => {
      setSelectedAyah(index);
      if (isPlaying && currentAyah === item.numberInSurah) {
        pauseAudio();
      } else {
        if (item.audio) {
          playAyah(item.numberInSurah, item.audio);
        }
      }
    }}>
      <View style={[
        styles.ayahContainer,
        selectedAyah === index && styles.highlightedAyah,
        currentAyah === item.numberInSurah && styles.playingAyah
      ]}>
        <Text style={styles.ayahNumber}>{item.numberInSurah}.</Text>
        <View style={styles.ayahTextContainer}>
          {displaySettings.showArabic && (
            <Text style={styles.ayahArabic}>{item.text}</Text>
          )}
          
          {displaySettings.showTranslation && translations[index] && (
            <Text style={styles.ayahTranslation}>
              {translations[index].text}
            </Text>
          )}
          
          {displaySettings.showTafseer && tafseer[index] && (
            <View style={styles.tafseerContainer}>
              <Text style={styles.tafseerHeader}>Tafseer:</Text>
              <Text style={styles.tafseerText}>{tafseer[index].text}</Text>
            </View>
          )}
        </View>
        <View style={styles.audioControls}>
          {currentAyah === item.numberInSurah && isPlaying ? (
            <Ionicons name="pause-circle" size={24} color="#344D92" />
          ) : (
            <Ionicons name="play-circle" size={24} color="#344D92" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTranslationOptions = () => (
    <View style={styles.translationOptions}>
      <Text style={styles.translationTitle}>Translation:</Text>
      <TouchableOpacity 
        style={[
          styles.translationButton,
          translationLanguage === 'en.sahih' && styles.selectedTranslation
        ]}
        onPress={() => changeTranslation('en.sahih')}
      >
        <Text style={[
          styles.translationButtonText,
          translationLanguage === 'en.sahih' && styles.selectedTranslationText
        ]}>
          English (Sahih)
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.translationButton,
          translationLanguage === 'ur.jalandhry' && styles.selectedTranslation
        ]}
        onPress={() => changeTranslation('ur.jalandhry')}
      >
        <Text style={[
          styles.translationButtonText,
          translationLanguage === 'ur.jalandhry' && styles.selectedTranslationText
        ]}>
          Urdu (Jalandhry)
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.translationButton,
          translationLanguage === 'en.pickthall' && styles.selectedTranslation
        ]}
        onPress={() => changeTranslation('en.pickthall')}
      >
        <Text style={[
          styles.translationButtonText,
          translationLanguage === 'en.pickthall' && styles.selectedTranslationText
        ]}>
          English (Pickthall)
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!selectedSurah) return null;

  return (
    <View style={styles.ayahsContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setScreen('surahs')}>
        <Text style={styles.backButtonText}>⬅ Back</Text>
      </TouchableOpacity>
      
      <View style={styles.surahHeader}>
        <Text style={styles.screenTitle}>{selectedSurah.englishName}</Text>
        <Text style={styles.surahSubtitle}>
          {selectedSurah.englishNameTranslation} • {selectedSurah.revelationType}
        </Text>
      </View>
      
      {renderTranslationOptions()}
      
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setScreen('settings')}
      >
        <Text style={styles.settingsButtonText}>Display Settings</Text>
      </TouchableOpacity>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              if (selectedSurah?.number) {
                fetchAyahs(selectedSurah.number);
                fetchTranslations(selectedSurah.number);
                if (displaySettings.showTafseer) {
                  fetchTafseer(selectedSurah.number);
                }
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && ayahs.length === 0 ? (
        <ActivityIndicator size="large" color="#344D92" style={styles.loader} />
      ) : (
        <FlatList
          data={ayahs}
          renderItem={renderAyahItem}
          keyExtractor={item => item.number.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.noResultsText}>No ayahs found</Text>
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#344D92']}
              tintColor="#344D92"
            />
          }
        />
      )}
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={loadPreviousSurah}
        >
          <Text style={styles.navButtonText}>Previous Surah</Text>
        </TouchableOpacity>
        <Text style={styles.navInfo}>
          {currentSurahIndex + 1}/{surahs.length}
        </Text>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={loadNextSurah}
        >
          <Text style={styles.navButtonText}>Next Surah</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Settings Screen Component
const SettingsScreen = () => {
  const {
    setScreen,
    displaySettings,
    updateDisplaySettings,
    translationLanguage,
    changeTranslation,
  } = useContext(AppContext);

  const previousScreen = useContext(AppContext).screen;
  
  return (
    <View style={styles.settingsContainer}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setScreen(previousScreen === 'settings' ? 'home' : previousScreen)}
      >
        <Text style={styles.backButtonText}>⬅ Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.screenTitle}>Settings</Text>
      
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>Display Options</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show Arabic Text</Text>
          <Switch
            value={displaySettings.showArabic}
            onValueChange={(value) => updateDisplaySettings({ showArabic: value })}
            trackColor={{ false: '#767577', true: '#344D92' }}
            thumbColor={displaySettings.showArabic ? '#f5f5dc' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show Translation</Text>
          <Switch
            value={displaySettings.showTranslation}
            onValueChange={(value) => updateDisplaySettings({ showTranslation: value })}
            trackColor={{ false: '#767577', true: '#344D92' }}
            thumbColor={displaySettings.showTranslation ? '#f5f5dc' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show Tafseer (Urdu)</Text>
          <Switch
            value={displaySettings.showTafseer}
            onValueChange={(value) => updateDisplaySettings({ showTafseer: value })}
            trackColor={{ false: '#767577', true: '#344D92' }}
            thumbColor={displaySettings.showTafseer ? '#f5f5dc' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>Translation Language</Text>
        
        <TouchableOpacity
          style={[
            styles.languageOption,
            translationLanguage === 'en.sahih' && styles.selectedLanguage
          ]}
          onPress={() => changeTranslation('en.sahih')}
        >
          <Text style={[
            styles.languageText,
            translationLanguage === 'en.sahih' && styles.selectedLanguageText
          ]}>
            English (Sahih International)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageOption,
            translationLanguage === 'ur.jalandhry' && styles.selectedLanguage
          ]}
          onPress={() => changeTranslation('ur.jalandhry')}
        >
          <Text style={[
            styles.languageText,
            translationLanguage === 'ur.jalandhry' && styles.selectedLanguageText
          ]}>
            Urdu (Jalandhry)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageOption,
            translationLanguage === 'en.pickthall' && styles.selectedLanguage
          ]}
          onPress={() => changeTranslation('en.pickthall')}
        >
          <Text style={[
            styles.languageText,
            translationLanguage === 'en.pickthall' && styles.selectedLanguageText
          ]}>
            English (Pickthall)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageOption,
            translationLanguage === 'en.yusufali' && styles.selectedLanguage
          ]}
          onPress={() => changeTranslation('en.yusufali')}
        >
          <Text style={[
            styles.languageText,
            translationLanguage === 'en.yusufali' && styles.selectedLanguageText
          ]}>
            English (Yusuf Ali)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageOption,
            translationLanguage === 'ur.ahmedali' && styles.selectedLanguage
          ]}
          onPress={() => changeTranslation('ur.ahmedali')}
        >
          <Text style={[
            styles.languageText,
            translationLanguage === 'ur.ahmedali' && styles.selectedLanguageText
          ]}>
            Urdu (Ahmed Ali)
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          This Quran app allows you to read the Quran in Arabic with translations in English and Urdu.
          It also provides Tafseer in Urdu to help understand the meaning of the verses.
        </Text>
        <Text style={styles.versionText}>Version 2.0.0</Text>
      </View>
    </View>
  );
};

// App Content Component
const AppContent = () => {
  const { screen } = useContext(AppContext);

  return (
    <View style={styles.appContainer}>
      {screen === 'home' && <HomeScreen />}
      {screen === 'surahs' && <SurahListScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen?.startsWith('surah-') && <AyahScreen />}
    </View>
  );
};

// Main App Component
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f5f5dc'
  },
  container: {
    flex: 1,
    padding: 20
  },
  topContainer: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomContainer: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quranIcon: {
    width: 100,
    height: 100,
    marginBottom: 5
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#344D92',
    marginBottom: 5
  },
  additionalImage: {
    width: 300,
    height: 250,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%'
  },
  button: {
    backgroundColor: '#344D92',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    flex: 1,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  surahListContainer: {
    flex: 1,
    padding: 15
  },
  ayahsContainer: {
    flex: 1,
    padding: 15
  },
  backButton: {
    padding: 10,
    backgroundColor: '#344D92',
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 15
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#344D92',
    textAlign: 'center'
  },
  surahHeader: {
    marginBottom: 15
  },
  surahSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5
  },
  searchInput: {
    height: 50,
    borderColor: '#344D92',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    backgroundColor: 'white'
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2
  },
  surahNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#344D92',
    marginRight: 15
  },
  surahTextContainer: {
    flex: 1
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  surahTranslation: {
    fontSize: 14,
    color: '#666'
  },
  surahRevelation: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic'
  },
  surahNameArabic: {
    fontSize: 20,
    color: '#344D92',
    fontFamily: 'Traditional Arabic',
    textAlign: 'right'
  },
  ayahContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  highlightedAyah: {
    backgroundColor: '#f0f0f0'
  },
  playingAyah: {
    backgroundColor: '#e6f0ff',
    borderLeftWidth: 3,
    borderLeftColor: '#344D92'
  },
  ayahNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#344D92',
    marginRight: 10
  },
  ayahTextContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  ayahArabic: {
    fontSize: 20,
    lineHeight: 30,
    color: '#333',
    textAlign: 'right',
    fontFamily: 'Traditional Arabic',
    marginBottom: 10
  },
  ayahTranslation: {
    fontSize: 16,
    lineHeight: 22,
    color: '#555',
    textAlign: 'left',
    marginBottom: 10
  },
  tafseerContainer: {
    marginTop: 5,
    padding: 10,
    backgroundColor: '#f9f9eb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B7A62'
  },
  tafseerHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B7A62',
    marginBottom: 5
  },
  tafseerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5D4E36'
  },
  audioControls: {
    marginLeft: 10
  },
  loader: {
    marginTop: 50
  },
  listContent: {
    paddingBottom: 20
  },
  translationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
    alignItems: 'center'
  },
  translationTitle: {
    marginRight: 10,
    fontWeight: 'bold',
    color: '#344D92'
  },
  translationButton: {
    padding: 8,
    margin: 5,
    borderRadius: 15,
    backgroundColor: '#e0e0e0'
  },
  selectedTranslation: {
    backgroundColor: '#344D92'
  },
  translationButtonText: {
    color: '#333',
    fontSize: 12
  },
  selectedTranslationText: {
    color: 'white'
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#344D92',
    padding: 8,
    borderRadius: 5
  },
  retryButtonText: {
    color: 'white'
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666'
  },
  // Settings Screen Styles
  settingsContainer: {
    flex: 1,
    padding: 15
  },
  settingSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#344D92',
    marginBottom: 15
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingLabel: {
    fontSize: 16,
    color: '#333'
  },
  languageOption: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#f0f0f0'
  },
  selectedLanguage: {
    backgroundColor: '#344D92'
  },
  languageText: {
    fontSize: 16,
    color: '#333'
  },
  selectedLanguageText: {
    color: 'white',
    fontWeight: 'bold'
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 10
  },
  versionText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 10
  },
  settingsButton: {
    backgroundColor: '#8B7A62',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 10
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  // Navigation buttons
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navButton: {
    padding: 10,
    backgroundColor: '#344D92',
    borderRadius: 5,
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  navInfo: {color: '#344D92',fontWeight: 'bold',
  },
});