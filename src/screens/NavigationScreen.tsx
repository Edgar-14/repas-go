import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Circle } from 'react-native-maps';
import SimpleIcon from '../components/ui/SimpleIcon';

interface NavigationProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

const NavigationScreen: React.FC<NavigationProps> = ({ navigation }) => {

    const legendItems = [
        { color: '#D63031', label: 'Alta Demanda' },
        { color: '#FBBF24', label: 'Moderada' },
        { color: '#22C55E', label: 'Baja' },
    ];
    
    const mexicoCityRegion = {
        latitude: 19.4326,
        longitude: -99.1332,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mapa de Demanda</Text>
                <TouchableOpacity 
                    style={styles.gpsButton}
                    onPress={() => navigation?.navigate('GPSNavigation')}
                >
                    <SimpleIcon type="navigation" size={20} color="#FFFFFF" />
                    <Text style={styles.gpsButtonText}>GPS</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="map" size={20} color="#00B894" />
                        <Text style={styles.cardTitle}>Mapa de Demanda en Vivo</Text>
                    </View>
                    
                    <View style={styles.mapContainer}>
                        <MapView
                            style={StyleSheet.absoluteFill}
                            initialRegion={mexicoCityRegion}
                            provider="google"
                            customMapStyle={mapStyle} // Applying grayscale style
                        >
                            {/* Heatmap hotspots simulation with react-native-maps */}
                             <Circle
                                center={{ latitude: 19.42, longitude: -99.16 }}
                                radius={1500}
                                fillColor="rgba(214, 48, 49, 0.2)"
                                strokeWidth={0}
                            />
                             <Circle
                                center={{ latitude: 19.425, longitude: -99.165 }}
                                radius={1000}
                                fillColor="rgba(214, 48, 49, 0.3)"
                                strokeWidth={0}
                            />
                            <Circle
                                center={{ latitude: 19.45, longitude: -99.14 }}
                                radius={2000}
                                fillColor="rgba(251, 191, 36, 0.2)"
                                strokeWidth={0}
                            />
                              <Circle
                                center={{ latitude: 19.40, longitude: -99.18 }}
                                radius={800}
                                fillColor="rgba(251, 191, 36, 0.3)"
                                strokeWidth={0}
                            />
                        </MapView>
                    </View>
                    
                    <View style={styles.legend}>
                        <Text style={styles.legendTitle}>Notificaciones de Demanda:</Text>
                        <View style={styles.legendItems}>
                            {legendItems.map(item => (
                                <View key={item.label} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: item.color }]}/>
                                    <Text style={styles.legendLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
                
                <View style={styles.statusGrid}>
                     <View style={[styles.card, styles.statusCard]}>
                        <MaterialCommunityIcons name="wifi" size={28} color="#00B894" />
                        <Text style={styles.statusTitle}>Estado de Red</Text>
                        <Text style={styles.statusValue}>Excelente</Text>
                     </View>
                      <View style={[styles.card, styles.statusCard]}>
                        <MaterialCommunityIcons name="satellite-variant" size={28} color="#00B894" />
                        <Text style={styles.statusTitle}>Señal GPS</Text>
                        <Text style={styles.statusValue}>Fuerte</Text>
                     </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const mapStyle = [
  { "stylers": [{ "saturation": -100 }, { "gamma": 0.8 }, { "lightness": 4 }, { "visibility": "on" }] }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    gpsButton: {
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        position: 'absolute',
        right: 16,
    },
    gpsButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        color: '#4A5568',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 8,
    },
    mapContainer: {
        height: 384, // 24rem
        backgroundColor: '#E2E8F0',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 16,
    },
    legend: {
        marginTop: 8
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
        marginBottom: 8,
    },
    legendItems: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    legendLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4A5568',
        marginLeft: 8,
    },
    statusGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusCard: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    statusTitle: {
        fontWeight: '600',
        color: '#2D3748',
        marginTop: 8,
    },
    statusValue: {
        fontSize: 14,
        color: '#22C55E',
        fontWeight: 'bold',
    },
});

export default NavigationScreen;
