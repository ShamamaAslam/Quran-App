import { Image, StyleSheet, Platform, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';

const ayahData = require('./ayah.json');

export default function ReadQuran() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchQuranData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.alquran.cloud/v1/quran/en.asad');
      const json = await response.json();
      setData(prevData => [...prevData, ...json.data.surahs.slice((page - 1) * 20, page * 20)]);
      setPage(page + 1);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuranData();
  }, []);

  const loadMore = () => {
    if (!loading) {
      fetchQuranData();
    }
  };

  const Item = ({ items }) => (
    <View style={styles.item}>
      <View style={{ backgroundColor: 'red', flex: 0.90, flexDirection: 'row', borderColor: 'grey', borderWidth: 1}}>
        <View style={{ flex: 0.50, backgroundColor: 'black', borderColor: 'grey', borderLeftWidth: 1}}>
          <Text style={{ color: 'white' }}>English</Text>
          <Text style={{ color: 'white' }}>{items.englishName}</Text>
        </View>
        <View style={{ flex: 0.50, backgroundColor: 'white' }}>
          <Text style={{ color: 'black' }}>Arabic</Text>
          <Text style={{ color: 'black' }}>{items.name}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: 'blue', flex: 0.10 }}>
        <Text>Parah Number</Text>
        <View style={{ backgroundColor: 'white', flex: 0.10 }}>
          <Text>{items.englishNameTranslation}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text> In the name of Allah </Text>
      <FlatList
        data={data}
        renderItem={({ item }) => <Item items={item} />}
        keyExtractor={(item, index) => index.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="green" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'green'
  },
  item: {
    flex: 1,
    backgroundColor: 'green',
    height: 100,

    
  },
});