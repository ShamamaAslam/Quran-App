import React from 'react';
import { View, Text, Image, Button, StyleSheet, Alert } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Quran</Text>
        <Image
          source={{ uri: 'https://as2.ftcdn.net/v2/jpg/07/04/62/61/1000_F_704626128_OhKu8DvcgPFdYeR8htXlVGAfK15nxuda.jpg' }}
          style={styles.quranIcon}
        />
        <View style={styles.lastReadContainer}>
          <Text style={styles.lastReadText}>Last Read</Text>
          <Text style={styles.surahName}>Al-Baqara</Text>
          <Text style={styles.verseText}>Verse No. 7</Text>
          <Text style={styles.timestamp}>Fri, Mar 02 2025 00:23 AM</Text>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.featuresTitle}>Features</Text>
        <View style={styles.buttonGrid}>
          <View style={styles.buttonContainer}>
            <Button title="Read Quran" color="black" onPress={() => Alert.alert('Read Quran pressed')} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Search" color="black" onPress={() => Alert.alert('Search pressed')} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Bookmark" color="black" onPress={() => Alert.alert('Bookmark pressed')} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Settings" color="black" onPress={() => Alert.alert('Settings pressed')} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    flex: 0.4,
    backgroundColor: '#344D92', // Blue background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  quranIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  lastReadContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 15,
    marginTop: 10,
  },
  lastReadText: {
    fontSize: 16,
    color: 'black',
  },
  surahName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  verseText: {
    fontSize: 16,
    color: 'black',
  },
  timestamp: {
    fontSize: 14,
    color: 'gray',
  },
  bottomSection: {
    flex: 0.6,
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  buttonContainer: {
    width: '45%', // Two buttons in one row
    margin: 10,
  },
});