import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Rarity, Chapter } from '../../types';
import { useBibleBooks } from '../../context/BibleBooksContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';

const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'ultraRare', 'disabled'];

export default function BulkRarityEditor({
  book,
}: {
  book: { bookName: string; chapters: Chapter[] };
}) {
  const [fromChapter, setFromChapter] = useState<string>('1');
  const [toChapter, setToChapter] = useState<string>(book.chapters.length.toString());
  const [fromRarities, setFromRarities] = useState<Rarity[]>([]);
  const [applyAllFrom, setApplyAllFrom] = useState<boolean>(false);
  const [toRarity, setToRarity] = useState<Rarity>('common');

  const { updateChapterRarities } = useBibleBooks();
  const { theme } = useThemeContext();
  const { alert } = useAlert();

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
      alert('Invalid Range', 'Please enter a valid chapter number range.');
      return;
    }

    const chaptersToUpdate = book.chapters.filter(
      (ch) => ch.chapter >= from && ch.chapter <= to,
    );

    if (chaptersToUpdate.length === 0) {
      alert('No Chapters Matched', 'No chapters matched the selected range.');
      return;
    }

    const updates = chaptersToUpdate.flatMap((ch) => {
      const current = (ch.rarity || 'common') as Rarity;
      const newRarity =
        direction === 'increase' ? getNextRarity(current) : getPreviousRarity(current);
      if (newRarity === current) return [];
      return [{ chapter: ch.chapter, rarity: newRarity }];
    });

    if (updates.length === 0) return;

    try {
      await updateChapterRarities(book.bookName, updates, true);
    } catch (err: any) {
      console.error(err);
      alert('Error', 'Failed to adjust chapter rarities.');
    }
  };

  const handleBulkRarityUpdate = async () => {
    const from = parseInt(fromChapter);
    const to = parseInt(toChapter);

    if (isNaN(from) || isNaN(to) || from > to) {
      alert('Invalid Range', 'Please enter a valid chapter number range.');
      return;
    }

    const selectedFrom = applyAllFrom ? rarities : fromRarities;
    if (!applyAllFrom && selectedFrom.length === 0) {
      alert(
        'No From Rarities',
        'Please select at least one "from" rarity or choose "apply to all".',
      );
      return;
    }

    const chaptersToUpdate = book.chapters?.filter(
      (ch) =>
        ch.chapter >= from &&
        ch.chapter <= to &&
        (applyAllFrom ||
          selectedFrom.includes((ch.rarity || 'common') as (typeof rarities)[number])),
    );

    if (chaptersToUpdate.length === 0) {
      alert('No Chapters Matched', 'No chapters matched the selected criteria.');
      return;
    }

    try {
      await updateChapterRarities(
        book.bookName,
        chaptersToUpdate.map((ch) => ({ chapter: ch.chapter, rarity: toRarity })),
        true,
      );
    } catch (err: any) {
      console.error(err);
      alert('Error', 'Failed to update chapter rarities.');
    }
  };

  const chipBg = (selected: boolean) => (selected ? theme.accent : theme.background);
  const chipFg = (selected: boolean) => (selected ? theme.onAccent : theme.text);

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        padding: 12,
        marginBottom: 12,
        marginTop: 2,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
      }}
    >
      <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 8 }}>
        Bulk Rarity Update
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: theme.text, marginRight: 8 }}>Chapters</Text>
        <TextInput
          style={[
            inputStyle,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
          placeholder="From"
          placeholderTextColor={theme.textDisabled}
          keyboardType="number-pad"
          value={fromChapter}
          onChangeText={setFromChapter}
        />
        <Text style={{ color: theme.text, marginHorizontal: 8 }}>to</Text>
        <TextInput
          style={[
            inputStyle,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
          placeholder="To"
          placeholderTextColor={theme.textDisabled}
          keyboardType="number-pad"
          value={toChapter}
          onChangeText={setToChapter}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Pressable
          onPress={() => bulkAdjustRarities('decrease')}
          style={{
            backgroundColor: theme.accent,
            padding: 8,
            borderRadius: 8,
            flex: 1,
            marginRight: 6,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.onAccent, fontWeight: '700' }}>Make All Less Rare</Text>
        </Pressable>

        <Pressable
          onPress={() => bulkAdjustRarities('increase')}
          style={{
            backgroundColor: theme.accent,
            padding: 8,
            borderRadius: 8,
            flex: 1,
            marginLeft: 6,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.onAccent, fontWeight: '700' }}>Make All More Rare</Text>
        </Pressable>
      </View>

      <Text style={{ color: theme.textMuted, marginBottom: 4 }}>From rarities:</Text>
      <Pressable
        onPress={() => setApplyAllFrom(!applyAllFrom)}
        style={{
          backgroundColor: chipBg(applyAllFrom),
          padding: 6,
          borderRadius: 6,
          alignSelf: 'flex-start',
          marginBottom: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
        }}
      >
        <Text style={{ color: chipFg(applyAllFrom), fontSize: 12 }}>
          {applyAllFrom ? '✔ Apply to all rarities' : 'Apply to all rarities'}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
        {rarities.map((r) => {
          const isSelected = fromRarities.includes(r);
          return (
            <Pressable
              key={r}
              onPress={() =>
                setFromRarities((prev) =>
                  isSelected ? prev.filter((val) => val !== r) : [...prev, r],
                )
              }
              disabled={applyAllFrom}
              style={{
                paddingHorizontal: 6,
                paddingVertical: 6,
                backgroundColor: chipBg(isSelected),
                margin: 4,
                borderRadius: 6,
                opacity: applyAllFrom ? 0.5 : 1,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{
                  color: chipFg(isSelected),
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
              >
                {r.toLowerCase() === 'ultrarare' ? 'Ultra-Rare' : r}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: theme.textMuted, marginRight: 6 }}>To:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
        {rarities.map((r) => (
          <Pressable
            key={r}
            onPress={() => setToRarity(r)}
            style={{
              paddingHorizontal: 6,
              paddingVertical: 6,
              backgroundColor: chipBg(toRarity === r),
              margin: 4,
              borderRadius: 6,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.border,
            }}
          >
            <Text
              style={{
                color: chipFg(toRarity === r),
                fontSize: 12,
                textTransform: 'capitalize',
              }}
              numberOfLines={1}
            >
              {r.toLowerCase() === 'ultrarare' ? 'Ultra-Rare' : r}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleBulkRarityUpdate}
        style={{
          marginTop: 16,
          backgroundColor: theme.accent,
          padding: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.onAccent, fontWeight: '700' }}>Update Selected Rarities</Text>
      </Pressable>
    </View>
  );
}

const inputStyle = {
  flex: 1,
  borderWidth: 1,
  padding: 6,
  marginRight: 4,
  minWidth: 60,
  borderRadius: 8,
};
