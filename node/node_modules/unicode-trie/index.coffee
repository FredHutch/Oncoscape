class UnicodeTrie
  # Shift size for getting the index-1 table offset.
  SHIFT_1 = 6 + 5

  # Shift size for getting the index-2 table offset.
  SHIFT_2 = 5

  # Difference between the two shift sizes,
  # for getting an index-1 offset from an index-2 offset. 6=11-5
  SHIFT_1_2 = SHIFT_1 - SHIFT_2

  # Number of index-1 entries for the BMP. 32=0x20
  # This part of the index-1 table is omitted from the serialized form.
  OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> SHIFT_1

  # Number of entries in an index-2 block. 64=0x40
  INDEX_2_BLOCK_LENGTH = 1 << SHIFT_1_2

  # Mask for getting the lower bits for the in-index-2-block offset. */
  INDEX_2_MASK = INDEX_2_BLOCK_LENGTH - 1

  # Shift size for shifting left the index array values.
  # Increases possible data size with 16-bit index values at the cost
  # of compactability.
  # This requires data blocks to be aligned by DATA_GRANULARITY.
  INDEX_SHIFT = 2

  # Number of entries in a data block. 32=0x20
  DATA_BLOCK_LENGTH = 1 << SHIFT_2

  # Mask for getting the lower bits for the in-data-block offset.
  DATA_MASK = DATA_BLOCK_LENGTH - 1

  # The part of the index-2 table for U+D800..U+DBFF stores values for
  # lead surrogate code _units_ not code _points_.
  # Values for lead surrogate code _points_ are indexed with this portion of the table.
  # Length=32=0x20=0x400>>SHIFT_2. (There are 1024=0x400 lead surrogates.)
  LSCP_INDEX_2_OFFSET = 0x10000 >> SHIFT_2
  LSCP_INDEX_2_LENGTH = 0x400 >> SHIFT_2

  # Count the lengths of both BMP pieces. 2080=0x820
  INDEX_2_BMP_LENGTH = LSCP_INDEX_2_OFFSET + LSCP_INDEX_2_LENGTH

  # The 2-byte UTF-8 version of the index-2 table follows at offset 2080=0x820.
  # Length 32=0x20 for lead bytes C0..DF, regardless of SHIFT_2.
  UTF8_2B_INDEX_2_OFFSET = INDEX_2_BMP_LENGTH
  UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6  # U+0800 is the first code point after 2-byte UTF-8

  # The index-1 table, only used for supplementary code points, at offset 2112=0x840.
  # Variable length, for code points up to highStart, where the last single-value range starts.
  # Maximum length 512=0x200=0x100000>>SHIFT_1.
  # (For 0x100000 supplementary code points U+10000..U+10ffff.)
  #
  # The part of the index-2 table for supplementary code points starts
  # after this index-1 table.
  #
  # Both the index-1 table and the following part of the index-2 table
  # are omitted completely if there is only BMP data.
  INDEX_1_OFFSET = UTF8_2B_INDEX_2_OFFSET + UTF8_2B_INDEX_2_LENGTH

  # The alignment size of a data block. Also the granularity for compaction.
  DATA_GRANULARITY = 1 << INDEX_SHIFT

  constructor: (json = {}) ->
    @data = json.data or []
    @highStart = json.highStart ? 0
    @errorValue = json.errorValue ? -1

  get: (codePoint) ->
    if codePoint < 0 or codePoint > 0x10ffff
      return @errorValue

    if (codePoint < 0xd800 or (codePoint > 0xdbff and codePoint <= 0xffff))
      # Ordinary BMP code point, excluding leading surrogates.
      # BMP uses a single level lookup.  BMP index starts at offset 0 in the index.
      # data is stored in the index array itself.
      index = (@data[codePoint >> SHIFT_2] << INDEX_SHIFT) + (codePoint & DATA_MASK)
      return @data[index]

    if codePoint <= 0xffff
      # Lead Surrogate Code Point.  A Separate index section is stored for
      # lead surrogate code units and code points.
      #   The main index has the code unit data.
      #   For this function, we need the code point data.
      index = (@data[LSCP_INDEX_2_OFFSET + ((codePoint - 0xd800) >> SHIFT_2)] << INDEX_SHIFT) + (codePoint & DATA_MASK)
      return @data[index]

    if codePoint < @highStart
      # Supplemental code point, use two-level lookup.
      index = @data[(INDEX_1_OFFSET - OMITTED_BMP_INDEX_1_LENGTH) + (codePoint >> SHIFT_1)]
      index = @data[index + ((codePoint >> SHIFT_2) & INDEX_2_MASK)]
      index = (index << INDEX_SHIFT) + (codePoint & DATA_MASK)
      return @data[index]

    return @data[@data.length - DATA_GRANULARITY]
    
  toJSON: ->
    res = 
      data: [@data...]
      highStart: @highStart
      errorValue: @errorValue
      
    return res

module.exports = UnicodeTrie
