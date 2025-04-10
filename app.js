import { Stack } from 'expo-router';

export default function AppLayout() {
  return <Stack />;
}



//
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, TextInput, Alert, Switch, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

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
  loadNextSurah: () => Promise<void>;
  loadPreviousSurah: () => Promise<void>;
  refreshing: boolean;
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
  loadNextSurah: async () => {},
  loadPreviousSurah: async () => {},
  refreshing: false
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
  const [refreshing, setRefreshing] = useState(false);
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
    if (screen.startsWith('surah-') && selectedSurah) {
      fetchTranslations(selectedSurah.number);
    }
  };

  // Load next Surah (for scroll down behavior)
  const loadNextSurah = async () => {
    if (!selectedSurah || !surahs.length) return;
    
    // If at the end, loop back to Surah Al-Fil (105)
    const nextNumber = selectedSurah.number === 114 ? 105 : selectedSurah.number + 1;
    const nextSurah = surahs.find(s => s.number === nextNumber);
    
    if (nextSurah) {
      // Pause any playing audio
      if (sound) {
        await sound.unloadAsync();
        setIsPlaying(false);
        setCurrentAyah(null);
      }
      
      setSelectedSurah(nextSurah);
      setScreen(`surah-${nextNumber}`);
      
      // Reset selected ayah
      setSelectedAyah(null);
      
      // Load new Surah data
      fetchAyahs(nextNumber);
      fetchTranslations(nextNumber);
      if (displaySettings.showTafseer) {
        fetchTafseer(nextNumber);
      }
    }
  };

  // Load previous Surah (for pull-to-refresh behavior)
  const loadPreviousSurah = async () => {
    if (!selectedSurah || !surahs.length) return;
    setRefreshing(true);
    
    // If at the beginning, loop to Surah An-Naas (114)
    const prevNumber = selectedSurah.number === 105 ? 114 : selectedSurah.number - 1;
    const prevSurah = surahs.find(s => s.number === prevNumber);
    
    if (prevSurah) {
      // Pause any playing audio
      if (sound) {
        await sound.unloadAsync();
        setIsPlaying(false);
        setCurrentAyah(null);
      }
      
      setSelectedSurah(prevSurah);
      setScreen(`surah-${prevNumber}`);
      
      // Reset selected ayah
      setSelectedAyah(null);
      
      // Load new Surah data
      await fetchAyahs(prevNumber);
      await fetchTranslations(prevNumber);
      if (displaySettings.showTafseer) {
        await fetchTafseer(prevNumber);
      }
    }
    
    setRefreshing(false);
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
    refreshing
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
    refreshing
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

  // Function to handle end of list detection (for loading next Surah)
  const handleEndReached = async () => {
    if (!loading) {
      await loadNextSurah();
    }
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

  // Info about current Surah and circular navigation
  const renderNavigationInfo = () => (
    <View style={styles.navigationInfo}>
      {selectedSurah && (
        <>
          <Text style={styles.navigationInfoText}>
            Current: Surah {selectedSurah.englishName} ({selectedSurah.number})
          </Text>
          <Text style={styles.navigationInfoText}>
            Scroll down for next Surah | Pull down for previous Surah
          </Text>
        </>
      )}
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
      {renderNavigationInfo()}
      
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
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#344D92']}
              tintColor="#344D92"
              title="Loading previous Surah..."
              titleColor="#344D92"
            />
          }
        />
      )}
    </View>
  );
};

// Add these new styles to your StyleSheet
const newStyles = {
  // Add these to your existing styles object
  surahIndicator: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center'
  },
  surahPosition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#344D92'
  },
  surahNavHelp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center'
  }
};


