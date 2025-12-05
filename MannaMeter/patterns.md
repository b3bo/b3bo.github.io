# Scripture Reference Detection Patterns

This document describes the regex patterns and validation logic used in the Scripture Counter tool to identify valid Scripture references in YouTube video transcripts. These patterns help filter out false positives by ensuring that Bible book names appear in contexts that suggest biblical citations.

## Overview

The tool uses multiple layers of validation to categorize Scripture references:

1. **Confirmed References**: Capitalized Bible book names that appear near scriptural context patterns
2. **Suspect References**: Lowercase Bible book names that appear near scriptural context patterns  
3. **False Positives**: Capitalized Bible book names without scriptural context
4. **Not Counted**: Lowercase Bible book names without scriptural context

## Validation Methods

### 1. Proximity Pattern Matching
For each potential Bible book match:
- Extract a 100-character context window around the match
- Check if any scriptural pattern appears within 50 characters of the book name
- Patterns are matched using proximity rather than strict adjacency for better accuracy

### 2. Chapter Number Validation
Additional validation using actual biblical book structure:
- If a book name is followed by a number (e.g., "Revelation 15"), validate against known chapter counts
- Books like Jude (1 chapter) and Revelation (22 chapters) are validated against their actual structure
- This catches references even when other patterns might be missed

## Patterns List

The following regex patterns are used to detect scriptural context:

| Pattern | Description | Example Usage |
|---------|-------------|---------------|
| `book of\s+` | References to "book of [Book]" | "book of John", "book of Genesis" |
| `chapter\s+\d+` | Chapter references | "chapter 3", "chapter 14" |
| `verse\s+\d+` | Verse references | "verse 16", "verse 2" |
| `\s*\d+:\d+` | Biblical citation format (chapter:verse) | "3:16", "1:1" |
| `\s*\d+\s+\d+` | Chapter and verse format | "3 16", "1 1" |
| `\s*\d+:\d+-\d+` | Verse ranges | "3:16-18", "1:1-5" |
| `\s*\d+\s+\d+-\d+` | Verse ranges | "3 16-18", "1 1-5" |
| `in\s+` | References like "in [Book]" | "in Matthew", "in Revelation" |
| `\s+says` | "says" following the book name | "John says", "Paul says" |
| `\s+teaches` | "teaches" following the book name | "Jesus teaches", "the Bible teaches" |
| `\s+tells` | "tells" following the book name | "the story tells", "Scripture tells" |
| `according to\s+` | "according to [Book]" | "according to Luke", "according to Romans" |
| `\s+scripture` | References to "Scripture" | "in Scripture", "the Scripture" |
| `\s+bible` | References to "Bible" | "in the Bible", "Bible says" |
| `\s+gospel` | References to "Gospel" | "Gospel of Mark", "the Gospel" |
| `\s+writes` | "writes" following the book name | "Paul writes", "John writes" |
| `says in\s+` | "says in [Book]" | "says in Hebrews", "says in Psalms" |

## Chapter Validation Examples

The tool validates chapter numbers against actual biblical book lengths:

| Book | Chapters | Valid Examples | Invalid Examples |
|------|----------|----------------|------------------|
| Jude | 1 | "Jude 1" | "Jude 2" |
| Revelation | 22 | "Revelation 15", "Revelation 22" | "Revelation 23" |
| Psalms | 150 | "Psalms 119" | "Psalms 151" |
| Philemon | 1 | "Philemon 1" | "Philemon 2" |

## How It Works

For each potential Bible book match in the transcript:

1. **Capitalization Check**: Determine if the book name is properly capitalized
2. **Context Extraction**: Get 100-character window around the match
3. **Pattern Proximity**: Check if any scriptural patterns appear within 50 characters
4. **Chapter Validation**: If no patterns found, check for valid chapter numbers following the book name
5. **Categorization**:
   - Capitalized + context → Confirmed
   - Lowercase + context → Suspect  
   - Capitalized + no context → False Positive
   - Lowercase + no context → Not Counted

## Effectiveness

Latest testing results (sample sermon video):
- **Total matches**: 75 Bible book name occurrences
- **Confirmed references**: 68 (capitalized + context)
- **Suspect references**: 3 (lowercase + context, validated by chapter numbers)
- **False positives**: 2 (capitalized but no context)
- **Not counted**: 2 (lowercase, no context)
- **Overall accuracy**: ~95% (71 valid references out of 75 total matches)

## Customization

To modify the validation:

- **Add patterns**: Update the `scripture_patterns` list in `main.py`
- **Update chapter counts**: Modify the `BOOK_CHAPTERS` dictionary
- **Adjust proximity**: Change the 50-character threshold in the proximity check
- **Add validation rules**: Extend the chapter validation logic for verses or other formats