import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [screen, setScreen] = useState('home');
  const [surahs, setSurahs] = useState([]);
  const [ayahs, setAyahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState('');
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSurahs, setFilteredSurahs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Save data to AsyncStorage
  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Data saved for key: ${key}`);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Load data from AsyncStorage
  const loadData = async (key) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  };

  // Fetch Surahs and cache them
  useEffect(() => {
    if (screen === 'surahs') {
      setLoading(true);
      loadData('surahs').then((cachedSurahs) => {
        if (cachedSurahs) {
          setSurahs(cachedSurahs);
          setFilteredSurahs(cachedSurahs);
          setLoading(false);
        } else {
          fetch(`https://api.alquran.cloud/v1/surah?page=${currentPage}`)
            .then(response => response.json())
            .then(data => {
              setSurahs(data.data);
              setFilteredSurahs(data.data);
              saveData('surahs', data.data); // Cache Surahs
              setLoading(false);
            })
            .catch(error => console.error('Error fetching Surahs:', error));
        }
      });
    }
  }, [screen, currentPage]);

  // Fetch Ayahs and cache them
  useEffect(() => {
    if (screen.startsWith('surah-')) {
      setLoading(true);
      const surahId = screen.split('-')[1];
      loadData(`surah-${surahId}`).then((cachedAyahs) => {
        if (cachedAyahs) {
          setAyahs(cachedAyahs);
          setSelectedSurah(cachedAyahs[0]?.surah?.englishName || '');
          setLoading(false);
        } else {
          fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.alafasy`)
            .then(response => response.json())
            .then(data => {
              setAyahs(data.data.ayahs);
              setSelectedSurah(data.data.englishName);
              saveData(`surah-${surahId}`, data.data.ayahs); // Cache Ayahs
              setLoading(false);
            })
            .catch(error => console.error('Error fetching Ayahs:', error));
        }
      });
    }
  }, [screen]);

  const highlightNextAyah = (index) => {
    if (index < ayahs.length) {
      setSelectedAyah(index);
      setTimeout(() => highlightNextAyah(index + 1), 1000);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = surahs.filter(surah => 
      surah.englishName.toLowerCase().startsWith(query.toLowerCase())
    );
    setFilteredSurahs(filtered);
  };

  return (
    <View style={styles.container}>
      {screen === 'home' && (
        <>
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
              <TouchableOpacity style={styles.button} onPress={() => setScreen('surahs')}>
                <Text style={styles.buttonText}>📖 Read Quran</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => alert('Search pressed')}>
                <Text style={styles.buttonText}>🔍 Search</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => alert('Bookmark pressed')}>
                <Text style={styles.buttonText}>🔖 Bookmark</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => alert('Settings pressed')}>
                <Text style={styles.buttonText}>⚙️ Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {screen === 'surahs' && (
        <View style={styles.surahContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => setScreen('home')}>
            <Text style={styles.backButtonText}>⬅ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Surahs</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Surahs..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              data={filteredSurahs}
              keyExtractor={(item) => item.number.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.surahItem}
                  onPress={() => setScreen(`surah-${item.number}`)}
                >
                  <Text style={styles.surahText}>{item.englishName}</Text>
                </TouchableOpacity>
              )}
              onEndReached={() => {
                if (hasMore) {
                  setCurrentPage(prevPage => prevPage + 1);
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => (
                loading ? <ActivityIndicator size="large" color="#0000ff" /> : null
              )}
            />
          )}
        </View>
      )}

      {screen.startsWith('surah-') && (
        <View style={styles.surahContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => setScreen('surahs')}>
            <Text style={styles.backButtonText}>⬅ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{selectedSurah}</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              data={ayahs}
              keyExtractor={(item) => item.number.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => highlightNextAyah(index)}>
                  <Text style={[styles.ayahText, selectedAyah === index && styles.highlightedAyah]}>{item.text}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5dc', padding: 20 },
  topContainer: { flex: 0.3, justifyContent: 'center', alignItems: 'center' },
  bottomContainer: { flex: 0.7, justifyContent: 'center', alignItems: 'center' },
  quranIcon: { width: 100, height: 100, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#344D92', marginBottom: 5 },
  additionalImage: { width: 300, height: 250, alignSelf: 'center', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '80%' },
  button: { backgroundColor: '#344D92', padding: 15, borderRadius: 10, margin: 10, flex: 1, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  surahContainer: { flex: 1, padding: 20, alignItems: 'center' },
  surahItem: { padding: 15, backgroundColor: 'lightgray', marginVertical: 5, borderRadius: 10, width: '100%', alignItems: 'center' },
  surahText: { fontSize: 18, fontWeight: 'bold' },
  ayahText: { fontSize: 16, padding: 10, backgroundColor: '#eef', marginVertical: 5, borderRadius: 5 },
  highlightedAyah: { backgroundColor: 'lightblue' },
  backButton: { padding: 10, backgroundColor: '#ff6666', borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10 },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '100%',
  },
});