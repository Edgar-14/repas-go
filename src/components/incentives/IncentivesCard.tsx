import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Incentive } from '../../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface IncentivesCardProps {
    incentive: Incentive;
}

const IncentivesCard: React.FC<IncentivesCardProps> = ({ incentive }) => {
    const progressPercentage = (incentive.progress / incentive.goal) * 100;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Target size={18} color="#00B894" style={styles.icon} />
                    <Text style={styles.title}>{incentive.title}</Text>
                </View>
                <View style={styles.rewardContainer}>
                    <DollarSign size={16} color="#00B894" />
                    <Text style={styles.rewardText}>{incentive.reward}</Text>
                </View>
            </View>
            <Text style={styles.description}>{incentive.description}</Text>
            <View style={styles.progressSection}>
                 <View style={styles.progressLabels}>
                    <Text style={styles.progressLabelText}>Progreso</Text>
                    <Text style={styles.progressValueText}>{incentive.progress} / {incentive.goal} viajes</Text>
                </View>
                <View style={styles.progressBarBackground}>
                    <View 
                        style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        marginRight: 8,
    },
    title: {
        fontWeight: 'bold',
        color: '#2D3748',
        fontSize: 16,
    },
    rewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 184, 148, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    rewardText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#00B894',
        marginLeft: 4,
    },
    description: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    progressSection: {
        marginTop: 16,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressLabelText: {
        fontWeight: '600',
        color: '#4A5568',
        fontSize: 14,
    },
    progressValueText: {
        color: '#A0AEC0',
        fontSize: 14,
    },
    progressBarBackground: {
        width: '100%',
        backgroundColor: '#EDF2F7',
        borderRadius: 999,
        height: 10,
    },
    progressBarFill: {
        backgroundColor: '#00B894',
        height: 10,
        borderRadius: 999,
    },
});

export default IncentivesCard;
