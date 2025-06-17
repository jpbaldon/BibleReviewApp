import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { Rarity, Chapter } from '../../types';
import { useBibleBooks } from '../../context/BibleBooksContext'

const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'ultraRare', 'disabled'];

export default function BulkRarityEditor({
  book,
  updateChapterRarity,
}: {
  book: { bookName: string; chapters: Chapter[] };
  updateChapterRarity: (bookName: string, chapter: number, rarity: Rarity, shouldUpdateBook: boolean) => Promise<void>;
}) {
  const [fromChapter, setFromChapter] = useState('1');
  const [toChapter, setToChapter] = useState(book.chapters.length.toString());
  const [fromRarities, setFromRarities] = useState<Rarity[]>([]);
  const [applyAllFrom, setApplyAllFrom] = useState(false);
  const [toRarity, setToRarity] = useState<Rarity>('common');
  const { updateBookEnabledStatus } = useBibleBooks();

  const getNextRarity = (rarity: Rarity): Rarity => {
    const index = rarities.indexOf(rarity);
    return rarities[Math.min(index + 1, rarities.length - 1)];
  };

  const getPreviousRarity = (rarity: Rarity): Rarity => {
    const index = rarities.indexOf(rarity);
    return rarities[Math.max(index - 1, 0)];
  };

  const bulkAdjustRarities = async (direction: 'increase' | 'decrease') => {
    const from = parseInt(fromChapter); 
    const to = parseInt(toChapter);

    if (isNaN(from) || isNaN(to) || from > to) {
        Alert.alert('Invalid Range', 'Please enter a valid chapter number range.');
        return;
    }

    const chaptersToUpdate = book.chapters.filter(
        ch => ch.chapter >= from && ch.chapter <= to
    );

    if (chaptersToUpdate.length === 0) {
        Alert.alert('No Chapters Matched', 'No chapters matched the selected range.');
        return;
    }

    try {
        await Promise.all(
        chaptersToUpdate.map(ch => {
            const current = (ch.rarity || 'common') as Rarity;
            const newRarity =
            direction === 'increase' ? getNextRarity(current) : getPreviousRarity(current);

            if (newRarity === current) return Promise.resolve(); // no change

            return updateChapterRarity(book.bookName, ch.chapter, newRarity, false);
        })
        );

        await updateBookEnabledStatus(book.bookName);

        //Alert.alert('Success', `Rarities ${direction}d for ${chaptersToUpdate.length} chapters.`);
    } catch (err: any) {
        console.error(err);
        Alert.alert('Error', 'Failed to adjust chapter rarities.');
    }
  };

  const handleBulkRarityUpdate = async () => {
    const from = parseInt(fromChapter);
    const to = parseInt(toChapter);

    if (isNaN(from) || isNaN(to) || from > to) {
      Alert.alert('Invalid Range', 'Please enter a valid chapter number range.');
      return;
    }

    const selectedFrom = applyAllFrom ? rarities : fromRarities;
    if (!applyAllFrom && selectedFrom.length === 0) {
      Alert.alert('No From Rarities', 'Please select at least one "from" rarity or choose "apply to all".');
      return;
    }

    const chaptersToUpdate = book.chapters?.filter(ch =>
      ch.chapter >= from &&
      ch.chapter <= to &&
      (applyAllFrom || selectedFrom.includes((ch.rarity || 'common') as typeof rarities[number]))
    );

    if (chaptersToUpdate.length === 0) {
      Alert.alert('No Chapters Matched', 'No chapters matched the selected criteria.');
      return;
    }

    try {
      await Promise.all(
        chaptersToUpdate.map(ch =>
          updateChapterRarity(book.bookName, ch.chapter, toRarity, false)
        )
      );

      await updateBookEnabledStatus(book.bookName);

      //Alert.alert('Success', `Updated ${chaptersToUpdate.length} chapters.`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to update chapter rarities.');
    }
  };

  return (
    <View style={{ backgroundColor: '#1e1e1e', padding: 12, marginBottom: 12, borderRadius: 8 }}>
      <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>Bulk Rarity Update</Text>

      {/* Chapter range inputs */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: 'white', marginRight: 8 }}>Chapters</Text>
        <TextInput
          style={inputStyle}
          placeholder="From"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          value={fromChapter}
          onChangeText={setFromChapter}
        />
        <Text style={{ color: 'white', marginHorizontal: 8 }}>to</Text>
        <TextInput
          style={inputStyle}
          placeholder="To"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          value={toChapter}
          onChangeText={setToChapter}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Pressable
            onPress={() => bulkAdjustRarities('decrease')}
            style={{
            backgroundColor: '#ff5252',
            padding: 8,
            borderRadius: 6,
            flex: 1,
            marginRight: 6,
            alignItems: 'center',
            }}
        >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Make All Less Rare</Text>
        </Pressable>

        <Pressable
            onPress={() => bulkAdjustRarities('increase')}
            style={{
            backgroundColor: '#ff5252',
            padding: 8,
            borderRadius: 6,
            flex: 1,
            marginLeft: 6,
            alignItems: 'center',
            }}
        >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Make All More Rare</Text>
        </Pressable>
      </View>

      {/* From rarity selection */}
      <Text style={{ color: '#ccc', marginBottom: 4 }}>From rarities:</Text>
      {/* Apply all toggle */}
      <Pressable
        onPress={() => setApplyAllFrom(!applyAllFrom)}
        style={{
            backgroundColor: applyAllFrom ? '#00e676' : '#333',
            padding: 6,
            borderRadius: 4,
            alignSelf: 'flex-start',
            marginBottom: 10,
        }}
        >
        <Text style={{ color: applyAllFrom ? '#000' : '#fff', fontSize: 12 }}>
          {applyAllFrom ? '✔ Apply to all rarities' : 'Apply to all rarities'}
        </Text>
      </Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
        {rarities.map(r => {
            const isSelected = fromRarities.includes(r);
            return (
            <Pressable
                key={r}
                onPress={() =>
                setFromRarities(prev =>
                    isSelected ? prev.filter(val => val !== r) : [...prev, r]
                )
                }
                disabled={applyAllFrom}
                style={{
                paddingHorizontal: 6,
                paddingVertical: 6,
                backgroundColor: isSelected ? '#00e676' : '#333',
                margin: 4,
                borderRadius: 4,
                opacity: applyAllFrom ? 0.5 : 1,
                }}
            >
                <Text style={{ color: '#fff', fontSize: 12, textTransform: 'capitalize' }}>
                {r}
                </Text>
            </Pressable>
            );
        })}
        </View>

        {/* To rarity buttons */}
      <Text style={{ color: '#ccc', marginRight: 6 }}>To:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>{rarities.map(r => (
        <Pressable
          key={r}
          onPress={() => setToRarity(r)}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 6,
            backgroundColor: toRarity === r ? '#00e676' : '#333',
            margin: 4,
            borderRadius: 4,
            opacity: 1,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, textTransform: 'capitalize' }}
            numberOfLines={1}
            adjustsFontSizeToFit={false}>{r}</Text>
        </Pressable>
      ))}</View>

      {/* Update button */}
      <Pressable
        onPress={handleBulkRarityUpdate}
        style={{
          marginTop: 16,
          backgroundColor: '#00e676',
          padding: 10,
          borderRadius: 6,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000', fontWeight: 'bold' }}>Update Selected Rarities</Text>
      </Pressable>
    </View>
  );
}

const inputStyle = {
  flex: 1,
  borderColor: '#666',
  borderWidth: 1,
  padding: 6,
  color: '#fff',
  marginRight: 4,
  minWidth: 60,
};