// QuranContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
export const QuranContext = createContext();

// Create the provider component
export const QuranProvider = ({ children }) => {
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
          if (searchQuery === '') {
            setFilteredSurahs(cachedSurahs); // Only update filteredSurahs if no search is active
          }
          setLoading(false);
        } else {
          fetch(`https://api.alquran.cloud/v1/surah?page=${currentPage}`)
            .then(response => response.json())
            .then(data => {
              const newSurahs = data.data;
              setSurahs((prevSurahs) => [...prevSurahs, ...newSurahs]);

              // Only update filteredSurahs if no search is active
              if (searchQuery === '') {
                setFilteredSurahs((prevFiltered) => [...prevFiltered, ...newSurahs]);
              }

              saveData('surahs', newSurahs); // Cache Surahs
              setLoading(false);
            })
            .catch(error => console.error('Error fetching Surahs:', error));
        }
      });
    }
  }, [screen, currentPage]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredSurahs(surahs); // Reset to all surahs if the query is empty
    } else {
      const filtered = surahs.filter(surah =>
        surah.englishName.toLowerCase().startsWith(query.toLowerCase())
      );
      setFilteredSurahs(filtered);
    }
  };

  // Highlight next Ayah
  const highlightNextAyah = (index) => {
    if (index < ayahs.length) {
      setSelectedAyah(index);
      setTimeout(() => highlightNextAyah(index + 1), 1000);
    }
  };

  // Value to be provided by the context
  const value = {
    screen,
    setScreen,
    surahs,
    ayahs,
    selectedSurah,
    setSelectedSurah,
    selectedAyah,
    setSelectedAyah,
    loading,
    searchQuery,
    setSearchQuery,
    filteredSurahs,
    setFilteredSurahs,
    currentPage,
    setCurrentPage,
    hasMore,
    setHasMore,
    handleSearch,
    highlightNextAyah,
  };

  return (
    <QuranContext.Provider value={value}>
      {children}
    </QuranContext.Provider>
  );
};