import { RecordingPresets, requestRecordingPermissionsAsync, useAudioPlayer, useAudioRecorder } from 'expo-audio';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

function RecordingItem({ uri, index }: { uri: string; index: number }) {
    const player = useAudioPlayer(uri);

    return (
        <Pressable onPress={() => player.play()}>
            <View style={styles.recordingItem}>
                <Text>Recording {index + 1}: {uri.split('/').pop()}</Text>
            </View>
        </Pressable>
    );
}

export default function Index() {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const [recordings, setRecordings] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);

    async function startRecording() {
        try {
            const permission = await requestRecordingPermissionsAsync();
            if (permission.status !== 'granted') {
                console.log("Permission not granted");
                return;
            }

            await recorder.prepareToRecordAsync();
            recorder.record();
            setIsRecording(true);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!isRecording) return;

        console.log('Stopping recording..');
        await recorder.stop();
        setIsRecording(false);

        // We get the URI from the recorder instance
        const uri = recorder.uri;
        console.log('Recording stopped and stored at', uri);
        if (uri) {
            setRecordings(prev => [...prev, uri]);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Audio Recorder</Text>

            <View style={styles.buttonContainer}>
                <Pressable
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                    style={({ pressed }) => [
                        styles.recordButton,
                        pressed ? styles.recordButtonPressed : null
                    ]}
                >
                    <Text style={styles.recordButtonText}>
                        {isRecording ? 'Recording...' : 'Hold to Record'}
                    </Text>
                </Pressable>
            </View>

            <FlatList
                data={recordings}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <RecordingItem uri={item} index={index} />
                )}
                style={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buttonContainer: {
        marginBottom: 20,
    },
    recordButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        minWidth: 200,
        alignItems: 'center',
    },
    recordButtonPressed: {
        backgroundColor: '#FF3B30',
    },
    recordButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    list: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 20,
    },
    recordingItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});
