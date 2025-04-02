import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, TextInput, Alert } from 'react-native';
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

type AppContextType = {
  screen: string;
  setScreen: (screen: string) => void;
  surahs: Surah[];
  ayahs: Ayah[];
  translations: Translation[];
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
  saveData: (key: string, data: any) => Promise<void>;
  loadData: (key: string) => Promise<any>;
  handleSearch: (query: string) => void;
  fetchSurahs: () => Promise<void>;
  fetchAyahs: (surahNumber: number) => Promise<void>;
  fetchTranslations: (surahNumber: number) => Promise<void>;
  changeTranslation: (newLanguage: string) => void;
  isPlaying: boolean;
  currentAyah: number | null;
  playAyah: (ayahNumber: number, audioUrl: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
};

// Create Context with default values
export const AppContext = createContext<AppContextType>({
  screen: 'home',
  setScreen: () => {},
  surahs: [],
  ayahs: [],
  translations: [],
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
  saveData: async () => {},
  loadData: async () => null,
  handleSearch: () => {},
  fetchSurahs: async () => {},
  fetchAyahs: async () => {},
  fetchTranslations: async () => {},
  changeTranslation: () => {},
  isPlaying: false,
  currentAyah: null,
  playAyah: async () => {},
  pauseAudio: async () => {}
});

// App Provider Component
const AppProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState('home');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
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
      
      const ayahsData = data.data.ayahs.map((ayah: any) => ({
        ...ayah,
        audio: `https://verses.quran.com/alawi_64k/${String(surahNumber).padStart(3, '0')}${String(ayah.numberInSurah).padStart(3, '0')}.mp3`
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
    saveData,
    loadData,
    handleSearch,
    fetchSurahs,
    fetchAyahs,
    fetchTranslations,
    changeTranslation,
    isPlaying,
    currentAyah,
    playAyah,
    pauseAudio
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
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Search feature coming soon')}>
            <Text style={styles.buttonText}>🔍 Search</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Bookmark feature coming soon')}>
            <Text style={styles.buttonText}>🔖 Bookmark</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Settings feature coming soon')}>
            <Text style={styles.buttonText}>⚙ Settings</Text>
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
    selectedSurah,
    selectedAyah,
    setSelectedAyah,
    translationLanguage,
    fetchAyahs,
    fetchTranslations,
    changeTranslation,
    isPlaying,
    currentAyah,
    playAyah,
    pauseAudio
  } = useContext(AppContext);

  useEffect(() => {
    if (selectedSurah?.number) {
      fetchAyahs(selectedSurah.number);
      fetchTranslations(selectedSurah.number);
    }
  }, [selectedSurah?.number, translationLanguage]);

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
          <Text style={styles.ayahArabic}>{item.text}</Text>
          {translations[index] && (
            <Text style={styles.ayahTranslation}>
              {translations[index].text}
            </Text>
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
          Sahih Intl
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.translationButton,
          translationLanguage === 'en.ahmedali' && styles.selectedTranslation
        ]}
        onPress={() => changeTranslation('en.ahmedali')}
      >
        <Text style={[
          styles.translationButtonText,
          translationLanguage === 'en.ahmedali' && styles.selectedTranslationText
        ]}>
          Ahmed Ali
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
          Pickthall
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
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              if (selectedSurah?.number) {
                fetchAyahs(selectedSurah.number);
                fetchTranslations(selectedSurah.number);
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
        />
      )}
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

// Styles
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
    alignItems: 'center'
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
    textAlign: 'left'
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
    marginBottom: 15,
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
  }
});