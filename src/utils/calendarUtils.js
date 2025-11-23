const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getWeekdayLabel = (dateString) => {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const date = new Date(dateString);
  return `${weekdays[date.getDay()]}요일`;
};

const formatYearMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const daysDiffFromToday = (date) => {
  if (!(date instanceof Date)) date = new Date(date);

  const today = new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // 미래는 양수, 과거는 음수, 오늘은 0
  return Math.round((start - base) / (1000 * 60 * 60 * 24));
};

/**
 * 기준 날짜에서 일정 일수(days)를 더하거나 뺀 날짜를 반환
 * @param {Date | string} date - 기준 날짜 (Date 객체 또는 문자열)
 * @param {number} days - 이동할 일수 (음수: 과거, 양수: 미래)
 * @returns {Date} 새로운 Date 객체
 */
const addDays = (date, days) => {
  const base = new Date(date);
  base.setDate(base.getDate() + days);
  return base;
};

/**
 * 미래 날짜 범위를 주어진 최대 일수(limitDays)로 제한
 * (예: startDate~endDate가 오늘로부터 20일 뒤라면 → 16일까지만 허용)
 * @param {Date | string} startDate - 시작 날짜
 * @param {Date | string} endDate - 종료 날짜
 * @param {number} limitDays - 최대 허용 일수 (기본 16일)
 * @returns {{ start: Date, end: Date }} 제한된 날짜 범위
 */
const clampFutureLimit = (startDate, endDate, limitDays = 16) => {
  const today = new Date();

  // 순수 날짜 비교용으로 시분초 제거
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 오늘부터 limitDays만큼의 미래 날짜 계산
  const maxAllowed = addDays(base, limitDays);

  // 종료일이 허용 범위를 초과하면 자르기
  if (end > maxAllowed) {
    return { start, end: maxAllowed };
  }

  return { start, end };
};

const formatDateString = (dateString) => {
  const date = new Date(dateString);

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = dayNames[date.getDay()];

  return `${month}월 ${day}일 (${dayName})`;
};

export {
  formatDateString,
  formatDate,
  formatYearMonth,
  addDays,
  clampFutureLimit,
  daysDiffFromToday,
  getWeekdayLabel,
};
