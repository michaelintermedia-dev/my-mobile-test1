import { useAudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface Recording {
    id: number;
    name: string;
    date: string;
}

export default function RecordingsScreen() {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const player = useAudioPlayer();

    useEffect(() => {
        fetchRecordings();
    }, []);

    async function fetchRecordings() {
        try {
            setLoading(true);
            setError(null);

            let apiUrl = 'http://localhost:5132/GetRecordings';

            if (Platform.OS !== 'web') {
                const host = '192.168.1.221';
                apiUrl = `http://${host}:5132/GetRecordings`;
            }

            console.log('Fetching recordings from:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRecordings(data);
                console.log('Fetched recordings:', data);
            } else {
                setError(`Failed to fetch: ${response.status}`);
            }
        } catch (err: any) {
            console.error('Error fetching recordings:', err);
            setError(err.message || 'Failed to fetch recordings');
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    async function handleRecordingClick(recording: Recording) {
        try {
            console.log('Downloading and playing:', recording.name);

            let apiUrl = `http://localhost:5132/DownloadAudio/${recording.name}`;

            if (Platform.OS !== 'web') {
                const host = '192.168.1.221';
                apiUrl = `http://${host}:5132/DownloadAudio/${recording.name}`;
            }

            console.log('Playing from:', apiUrl);

            if (Platform.OS === 'web') {
                // On web, download as blob and create object URL
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`Download failed: ${response.status}`);
                }

                const blob = await response.blob();
                const audioUrl = URL.createObjectURL(blob);

                player.replace(audioUrl);
            } else {
                // On native, use the URL directly - expo-audio can handle remote URLs
                player.replace(apiUrl);
            }

            player.play();
            setPlayingId(recording.id);

            console.log('Playing audio:', recording.name);
        } catch (err: any) {
            console.error('Error playing recording:', err);
            alert(`Failed to play recording: ${err.message}`);
        }
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading recordings...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
                <Pressable onPress={fetchRecordings} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Recordings</Text>
                <Pressable onPress={fetchRecordings} style={styles.refreshButton}>
                    <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                </Pressable>
            </View>

            {recordings.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No recordings found</Text>
                </View>
            ) : (
                <FlatList
                    data={recordings}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => handleRecordingClick(item)}
                            style={[styles.recordingItem, playingId === item.id && styles.recordingItemPlaying]}
                        >
                            <View style={styles.recordingInfo}>
                                <Text style={styles.recordingName}>
                                    {playingId === item.id ? '▶️' : '🎵'} {item.name}
                                </Text>
                                <Text style={styles.recordingDate}>{formatDate(item.date)}</Text>
                            </View>
                        </Pressable>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    refreshButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 15,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
    },
    listContent: {
        padding: 20,
    },
    recordingItem: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    recordingItemPlaying: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
        borderWidth: 2,
    },
    recordingInfo: {
        flex: 1,
    },
    recordingName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 6,
    },
    recordingDate: {
        fontSize: 14,
        color: '#666',
    },
});
