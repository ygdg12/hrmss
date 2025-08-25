exports.dayDiffInclusive = (start, end) => {
  const s = new Date(start); s.setHours(0,0,0,0);
  const e = new Date(end);   e.setHours(0,0,0,0);
  return Math.floor((e - s) / (24*60*60*1000)) + 1; // inclusive
};
