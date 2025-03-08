import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Home({navigation}) {
  return (

    <View style={styles.container}>

                              {/* This is the OUTER above container  */}

    <View style={styles.subcontainer1}>

        <Text style={{fontWeight:'bold', fontSize: 20}}>QURAN</Text>

    <Image source={{uri: 'data:image/png;base64,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'}}
       style={{width: 120, height: 120, resizeMode: 'contain'}} />
      
      <Text style={{fontWeight:'bold', fontSize: 17}}>Surah Fatiha</Text>
      
    </View>,

                                     {/* This is the outer BELOW container*/}

    <View style={styles.subcontainer2}>

        <Text style={{fontWeight:'bold', fontSize: 25, paddingLeft: 150, paddingTop: 20}}>Features</Text>


                                 {/* Add touchable opacity to 1st BOX navigate to other screen*/}

    
        <TouchableOpacity onPress={()=>{navigation.navigate('ReadQuran')}}>

        <View style={{width: 160, height: 200, padding:30, margin: 15, borderColor: 'grey', borderWidth: 2, borderRadius: 20, justifyContent: 'center', alignItems:'center'}}>
            <Image source={{uri: 'data:image/png;base64,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'}}
       style={{width: 100, height: 100, resizeMode: 'contain'}} />

            <Text style={{fontWeight: 'bold', marginTop: 10, paddingTop: 10}}>Read Quran</Text>
        </View>

        </TouchableOpacity>

                            {/* BOX 2  */}

        <View style={{width: 160, height: 200, padding:30, margin: 15, borderColor: 'grey', borderWidth: 2, borderRadius: 20, justifyContent: 'center', alignItems:'center'}}> 
        <Image source={{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARMAAAC3CAMAAAAGjUrGAAAAilBMVEX///8aGhoAAAAZGRn8/PwXFxcSEhIREREcHBy4uLjl5eUJCQn09PQNDQ3s7Ozh4eG+vr6SkpLFxcWAgIDQ0NAjIyPMzMzp6elLS0s/Pz/b29unp6ednZ0rKyuwsLCLi4uBgYGfn59fX19UVFRKSkpsbGw3Nzdqamqrq6t3d3dZWVlDQ0MwMDA4ODhSWjxDAAAKZklEQVR4nO1dC3PiIBBOFkjQPHzUR6uttlprrdf///cOogHUxFoDCk2+uZmbu9FA1v32xQKe16BBgwYNGjRo0KBBgwYNdCBOO4N+t9VqdfuTdoqz/8N3ntP9gAez18U3BQXRy/vquZ/ee2Z3wmi+5EIIA4J8n1Kfg/qIBAn735fNbHzvCd4YcWvBxYH8MpCIyaU34Z+tBY1wfxVBgmipQHYqQwOAj7dasCh++wcRoZwv54XClYiJZTW494yNgrEgngME52VxJJkIHvvsq3+WQSmTiLCnlwqFJrAd3XvmRsB/5zcC5Vb1HEJYdO79AgaAvcE3kDIN4aKi5/QngflfYw/28AaIX6glPCKJ8ogtKTY2iBIY/jUCDSgcORr2D4oIj8+G74vNvPf83Js/rL4+uGiCY+FR5rkDeP1TqtJjSnLymiELy9bTUXrwpjietObbCCLkH6sVgqf2n3FAeAEnERqLPB6ne8OJvePEL+1vdmJRJML+BNC9x/y1A3vtIajmk2ZBx3b6U4Q62mShjJAm/x6C3p+IVUZHQRpFLDidXPLNePpx7KoQrP5ABtQ9NiURPLQv+iZ7ddw6kQosHBcJ9lpqmMaynBBWvysCzAL2BOUZCB6x2/SZwaGdhO3vU7o5JAeqAlvsMn1aB5rPMpdnbiJ/9ULsw53Hw5yAa4qjwMy8qu9C4enarIXHN1T6c1h7rqpKG5B8D+ZuXq98Dnv7EYkUf07hwVGTEg8DxTgSmF3rRTnb4gP+UHhzUE/YjL8i5SWCoGq9bMUiP5rLBYF75Tf2y87VgD4knco/7AMoWSQhsZaJ3hQj1QuHNNVgAHqqlKMvHbO8KWIiwlcWqL3oKb/PQSTL1HfPpGwUNSGhrsrhhmmKNCmXpQjWoK+IBMFEj+dkD5FVB0qTRw3PvB3wUCmVQUvjg79lnE+Zd3eIPT1FTWCu88ljJc0m1CHfk4Kf8x4l7zoLHjzRFpykTNxuKApjvWJg9VvClazaIXCm+aCthOHwqffZLPd7kXU72Oh9ujkoasJ8g17txtynId81RRmLOdPMDWt+PPbWMpHSa8DNYS6tIM/p9Q/AhJ5HswSccD04kVF9aKClBqtS50UDByCq0jRbjTGBVFqU4MnMEHrxmEeaCBlT7FeQdUgHCinjfLrIv7rYeMEgQlGYybIebznXGXWq15GKgb1VIgN8+0PZpYiowqW5ZcwR5DUDBNb3pUjzh3Tmwyf4R3JLbn+IIlM0EpgMHUTmTcnQ4DBasBExZrI2Oc5E8Ty2x/f/RMBmlDqeR8Sqq+GBKkNJicFsW/iDGMmcy9eDbk5zFLybHaklyBMaHqkqctOHUPRqdiQZtqHI7ghlsTexlLPc7FRfpOWyu8k6nyiixie6EKGs3d2QWDGxpseSawMwNT1WFYxlxPbP9FiyLcxuxzMRepIsTI81EDIxP1YVyCVR8yl8W4zFk017IbMdUyU2iVhUZe2utU2lTAzXSbEX5yJhtsvmAEUUlJDuta5TYBGgkBebZfIs9WRmeiws0k0ytHlB41nqyQ1lgtyQiXE9wSp3rJbJ2w1jy3johj2ZiQT+Br44yf1O8G16rCroSpkYrxzzxp99zGZ1AWUgFrwi450hEykTq1tlO8KemC6zKSU937z8qyAWOSCJTI81vWEeUQnC7lHDjSGYt9/nMrG7cL8NhExMr/eLoWxvLXi4WRIYB7Iea3PI5nmfe5lQP1qbrVHLkhJ5MTlOdSgzHZoNLmXInBiWflWoGn3RXvOrIXs6+GZUq/EY3sZDCq9PbTex6gqD2YpgS2l9tJs6qkFBRsmzTvLNgZHVVXsOPCT5riOTaWAs9jbdoMpZGaIpB6HE1Bg48zp0LxPbW3KwXOIxuYyOP2QnoQs74OQOBHN1ja6yLm0/dXiPs/QIpto0n0Ra5cYmBLlm7JvZ2cn5KQ5Zsrt2IiDDNh/6Bp6Pve8QiY7hge3RSYau9JPBh4kBZuLgAoMmSzM+iLSAz/p/RiWnQna3KAlg9juK9jsT0YOy3dCMHuoHVhqHqYHjJ8T2A/aX5VVHFTJBY/5Y84IgZszZR7A03Op9tlE8CdeDfM2eYREJP+zWYTkyO6Z+oG+FG+/La3s9iYzuctAO9fiTSNveJqwG9cY7+nUjpoHYS4L4Dno9QpkAodLPW90WW4Cu1HF9W7H4QR/iSKVk6UQEq2IDVPlJNRz7ir3xUD111SE/nAMP1aMeM6FUfGJ7GKpHWhP7N0eeoKOef0mzHuJKUplAcHTau4NCOTg6NjsLt4pMTs7m5YlD3zmTMlccMtOUj3GFN+idXhhAETFSizCLhXoaoR9yq/hrS5t9Pv7iB7OdCCXbcO2UprDJLg+OGSawuu4FuhCV3KHgu0UfPlX8fkAfBPSKeke6grLberimOEef+OlAKExVfnVDCpfrNIIicahCcUhTuPHA26M3iuAhvdArc9vT+vfD/TTIMZeced+FKhRE+ZH/mwt1BbdeTi/acJ8+eHcW7oE1YFJZ9LH3k7a0e8MfJbKDY/ThmJ5cIYISGL6eLQiln0vgIcklFzsh5zSFYRDAkVAovwEwWn0WtmOk/fkWIEtufroxb/8wBw6GOUG8KLKUKAJItq/T7qSdxgzpuDOa9dZDKLgbDvG7zlC52jhIH8afqOBNkE/C3a1VhGaXFDEkBBVcDcdM82IQBmVqg1xZ6TlAe1lgMOnuddkrIULESlnRiwPfJNU5c7egi/RhoQbhtvaK2/AoS5U2WaG7Ex3XC5RPuUcfHr/1kmsuCGScWu5sMfY6YVj6McvPcigC/w3TV/i1VJLscs38EZ2oPGRx0qYwpD1+1d1FLpbFvDy8W6p2AnObUv5l9+jj7ZRl9njZPayUJBDO2/nX8gd0Su5V5N+gjmoKQ6f3cfZGZ64kLKYL192iX71DgpLSAXKWPhkmz+/7WMTPfNGu8Yii7N8Bv11y0y1eU8Xc+5TL0kn6eDkV4lFvQXZhWhIEAQmCcH/x6NPDrCM/d/rtc3EKdTD3OUI6aD0/rL8en76/v7fL9Wb+2f+hkMAFVU4fJ12yDuCdUErp03WTPtVwlj7ITLul5eBa0A6D4koCdbOeogFMU/ywNPWpJ30wz33K6EPdjlOuRUYfCErT7PrSh5zLfepKH1RKHzcrbzrQ2JQTnA/za+t92qis8lZbTWH0oUFJ6sPXYd1rBNQAnLnkhj4qOH3KDW19vU+bhg19DnEuTvGR+dPCbQSnT2k5ktY1S2b08cvowzfE19Km4Mwll9GH1pY+wTn61NLQ7ipvZfSpZ5zCg7cz9HGu41oLsHdGKNTyg3cNop0Epcvzlp8KaQrnwnzf3LE9VoPRZ0xLm3ac2o2sFe3S0oFz+0x1AXvjEvog+y8SNAROH7+YPrWVCcd4WNgdWVvueBl9SIGmuHXig2Zw+hS0YhDjt2lZDaYpNDkSCa1pzCaAT+IURGhNY/scjD5pcCgUV3v/tKJN+TmZPP2h/Li/mhZQjhAvIMk2r6MAhjX2ORKcKKOvfW/ptNpZCX8L8aDV6rfvPYsGbqDhTYMGDRo0aNCgQYN64j+D3mmbZfNYvQAAAABJRU5ErkJggg=='}}
       style={{width: 100, height: 100, resizeMode: 'contain'}} />
            <Text style={{fontWeight: 'bold', marginTop: 10, paddingTop: 10}}>Search</Text>
        </View>

                              {/* BOX 3  */}

        <View style={{width: 160, height: 200, padding:30, margin: 15, borderColor: 'grey', borderWidth: 2, borderRadius: 20, justifyContent: 'center', alignItems:'center'}}>
        <Image source={{uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMTikljzoXjw1Fu2XjD1k4zDTaZvDfxIj5UA&s'}}
       style={{width: 100, height: 100, resizeMode: 'contain'}} />
            <Text style={{fontWeight: 'bold', marginTop: 10, paddingTop: 10}}>Book Mark</Text>
        </View>


                            {/* BOX 4  */}

        <View style={{width: 160, height: 200, padding:30, margin: 15, borderColor: 'grey', borderWidth: 2, borderRadius: 20, justifyContent: 'center', alignItems:'center'}}>
        <Image source={{uri: 'data:image/png;base64,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'}}
       style={{width: 100, height: 100, resizeMode: 'contain'}} />
            <Text style={{fontWeight: 'bold', marginTop: 10, paddingTop: 10}}>Setting</Text>
        </View>

    </View>

    </View>
  );
}

const styles = StyleSheet.create({

    container: {

        flex: 1,

    },

    subcontainer1: {
        flex: 0.3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0099CC'

        
    },

    subcontainer2: {

        flex: 0.7, 
        flexWrap: 'wrap',
        flexDirection: 'row'
        

    }

});