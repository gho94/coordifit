import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MainPage.module.css";

import userIcon from "@/assets/images/mainpage/usericon.png";
import closetIcon from "@/assets/images/mainpage/closeticon.png";
import calendarIcon from "@/assets/images/mainpage/calendaricon.png";
import aiIcon from "@/assets/images/mainpage/aiicon.png";
import lastWornIcon from "@/assets/images/mainpage/lastwornicon.png";
import snapIcon from "@/assets/images/mainpage/snapicon.png";

import heroCloset from "@/assets/images/mainpage/closetcarousel.png";
import heroCalendar from "@/assets/images/mainpage/calendarcarousel.png";
import heroSnap from "@/assets/images/mainpage/snapcarousel.png";
import heroAi from "@/assets/images/mainpage/fittingcarousel.png";
import aiBanner from "@/assets/images/mainpage/ai-banner.png";
import calendarPlus from "@/assets/images/mainpage/calendar-plus.png";
import shirtIcon from "@/assets/images/mainpage/shirt.png";
import poloIcon from "@/assets/images/mainpage/kara.png";
import shortSleeveIcon from "@/assets/images/mainpage/short.png";
import longSleeveIcon from "@/assets/images/mainpage/long.png";
import hoodieIcon from "@/assets/images/mainpage/hood.png";
import shortsIcon from "@/assets/images/mainpage/shortpants.png";
import jeansIcon from "@/assets/images/mainpage/jeans.png";
import skirtIcon from "@/assets/images/mainpage/skirt.png";
import coatIcon from "@/assets/images/mainpage/coat.png";
import paddingIcon from "@/assets/images/mainpage/jumper.png";
import sneakersIcon from "@/assets/images/mainpage/sneakers.png";
import dressShoesIcon from "@/assets/images/mainpage/shoes.png";
import sunnyIcon from "@/assets/images/mainpage/sunnyicon.png";
import overcastIcon from "@/assets/images/mainpage/overcasticon.png";
import rainyIcon from "@/assets/images/mainpage/rainyicon.png";
import snowIcon from "@/assets/images/mainpage/snowicon.png";
import snapFallback1 from "@/assets/images/mainpage/snap1.png";
import snapFallback2 from "@/assets/images/mainpage/snap2.png";
import snapFallback3 from "@/assets/images/mainpage/snap3.png";
import snapFallback4 from "@/assets/images/mainpage/snap4.png";
import heartBlack from "@/assets/images/hearticon_white.png";
import heartRed from "@/assets/images/hearticon_red.png";
import profileImage from "@/assets/images/mainpage/usericon.png";

import clothesService from "@/services/clothesService";
import postService from "@/services/postService";
import commonCodeService from "@/services/commonCodeService";
import { getDailyLooksByMonth } from "@/services/dailyLookApi";
import { getCurrentWeatherRange, getPastWeatherRange } from "../../services/weatherApi";
import { useUserStore } from "@/stores/userStore";

const HERO_CARDS = [
  {
    id: "closet",
    title: "옷장 관리의 시작, 새 옷을 사는 순간부터.",
    subtitle: "나만의 스타일을 완성하는 가장 쉬운 방법",
    image: heroCloset,
    destination: "/closet",
  },
  {
    id: "calendar",
    title: "코디 관리의 시작, 캘린더에 담는 순간부터.",
    subtitle: "데일리코디로 완성하는, 나만의 스타일 캘린더",
    image: heroCalendar,
    destination: "/calendar",
  },
  {
    id: "snap",
    title: `<span style="color:#A7C7E7;">나만의 코디</span><br/><span style="color:#333333;">스냅으로 기록하고 공유해요</span>`,
    subtitle: "#데일리룩 #오오티디",
    image: heroSnap,
    destination: "/snap",
  },
  {
    id: "ai",
    title: "나만의<br/>AI 스타일리스트",
    subtitle: "AI 가상 피팅으로 나만의 룩을 완성하세요.",
    image: heroAi,
    destination: "/ai-fitting",
  },
];

const CATEGORY_ROWS = [
  [
    {
      id: "shirts",
      label: "셔츠",
      image: shirtIcon,
      mainLabel: "상의",
      subLabel: "셔츠",
      fallbackMainId: "top",
      fallbackSubId: "shirts",
    },
    {
      id: "polo",
      label: "카라티",
      image: poloIcon,
      mainLabel: "상의",
      subLabel: "카라티",
      subLabelAlternatives: ["폴로"],
      fallbackMainId: "top",
      fallbackSubId: "polo",
    },
    {
      id: "short-sleeve",
      label: "반팔티",
      image: shortSleeveIcon,
      mainLabel: "상의",
      subLabel: "반팔",
      subLabelAlternatives: ["반팔티"],
      fallbackMainId: "top",
      fallbackSubId: "short-sleeve",
    },
    {
      id: "long-sleeve",
      label: "긴팔티",
      image: longSleeveIcon,
      mainLabel: "상의",
      subLabel: "긴팔티",
      subLabelAlternatives: ["긴팔티"],
      fallbackMainId: "top",
      fallbackSubId: "long-sleeve",
    },
    {
      id: "hoodie",
      label: "후드티",
      image: hoodieIcon,
      mainLabel: "상의",
      subLabel: "후드티",
      subLabelAlternatives: ["후드티"],
      fallbackMainId: "top",
      fallbackSubId: "hoodie",
    },
    {
      id: "shorts",
      label: "반바지",
      image: shortsIcon,
      mainLabel: "하의",
      subLabel: "반바지",
      subLabelAlternatives: ["숏팬츠"],
      fallbackMainId: "bottom",
      fallbackSubId: "shorts",
    },
  ],
  [
    {
      id: "jeans",
      label: "청바지",
      image: jeansIcon,
      mainLabel: "하의",
      subLabel: "청바지",
      subLabelAlternatives: ["데님"],
      fallbackMainId: "bottom",
      fallbackSubId: "jeans",
    },
    {
      id: "skirt",
      label: "치마",
      image: skirtIcon,
      mainLabel: "하의",
      subLabel: "치마",
      subLabelAlternatives: ["스커트"],
      fallbackMainId: "bottom",
      fallbackSubId: "skirt",
    },
    {
      id: "coat",
      label: "코트",
      image: coatIcon,
      mainLabel: "아우터",
      subLabel: "코트",
      fallbackMainId: "outer",
      fallbackSubId: "coat",
    },
    {
      id: "padding",
      label: "패딩",
      image: paddingIcon,
      mainLabel: "아우터",
      subLabel: "패딩",
      subLabelAlternatives: ["점퍼"],
      fallbackMainId: "outer",
      fallbackSubId: "padding",
    },
    {
      id: "sneakers",
      label: "스니커즈",
      image: sneakersIcon,
      mainLabel: "신발",
      subLabel: "스니커즈",
      subLabelAlternatives: ["운동화"],
      fallbackMainId: "shoes",
      fallbackSubId: "sneakers",
    },
    {
      id: "dress-shoes",
      label: "구두",
      image: dressShoesIcon,
      mainLabel: "신발",
      subLabel: "구두",
      subLabelAlternatives: ["로퍼"],
      fallbackMainId: "shoes",
      fallbackSubId: "dress-shoes",
    },
  ],
];

const RECENT_CATEGORY_TABS = [
  { id: "top", label: "상의", fallbackMainId: "top" },
  { id: "bottom", label: "하의", fallbackMainId: "bottom" },
  { id: "shoes", label: "신발", fallbackMainId: "shoes" },
  { id: "outer", label: "아우터", fallbackMainId: "outer" },
  { id: "fashion-item", label: "패션소품", fallbackMainId: "fashion-item" },
];
const SNAP_FALLBACKS = [snapFallback1, snapFallback2, snapFallback3, snapFallback4];
const PLACEHOLDER_LIKES = [428, 356, 512, 289, 643, 398];
// SNAP_FALLBACK_DATA는 컴포넌트 내부에서 사용자 정보와 함께 생성

// 날씨 코드에 따른 아이콘 매핑
const getWeatherIcon = (code) => {
  if (code === 0) return sunnyIcon; // 맑음
  if ([1, 2, 3, 45, 48].includes(code)) return overcastIcon; // 구름/안개
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return rainyIcon; // 비/폭풍
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return snowIcon; // 눈
  return sunnyIcon; // 기본값
};

// 날씨 코드에 따른 라벨 매핑
const getWeatherLabel = (code) => {
  if (code === 0) return "맑음";
  if ([1, 2, 3].includes(code)) return "구름";
  if ([45, 48].includes(code)) return "안개";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "비";
  if ([95, 96, 99].includes(code)) return "폭풍";
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return "눈";
  return "맑음";
};
// ✅ 이번 달 1일부터 오늘+7일까지 캘린더 카드 생성
const generateCurrentMonthDays = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();

  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // 이번 달 1일부터 오늘+7일까지 생성
  const endDate = todayDate + 7;

  for (let date = 1; date <= endDate; date++) {
    const dateObj = new Date(year, month, date);
    const localDateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

    days.push({
      id: localDateString,
      day: dayNames[dateObj.getDay()],
      date: dateObj.getDate(),
      dateObj,
      isExtra: false,
    });
  }

  return days;
};
const MainPage = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [isLoadingClothes, setIsLoadingClothes] = useState(true);
  const [rawClothes, setRawClothes] = useState([]);
  const [clothesError, setClothesError] = useState(null);
  const [isLoadingSnaps, setIsLoadingSnaps] = useState(false);
  const [snapError, setSnapError] = useState(null);
  const [snaps, setSnaps] = useState([]);
  const [activeRecentTab, setActiveRecentTab] = useState(RECENT_CATEGORY_TABS[0].id);
  const [categoryError, setCategoryError] = useState(null);
  const [dailyLooks, setDailyLooks] = useState([]);
  const [isLoadingDailyLooks, setIsLoadingDailyLooks] = useState(true);
  const [weatherData, setWeatherData] = useState({});
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [todayWeather, setTodayWeather] = useState(null);
  const [isLoadingTodayWeather, setIsLoadingTodayWeather] = useState(true);
  const [categoryMappings, setCategoryMappings] = useState({
    mainByName: {},
    mainNameByCode: {},
    subByName: {},
    subToMain: {},
  });
  const scrollRef = useRef(null);
  const [activeCalendarIndex, setActiveCalendarIndex] = useState(1);

  const handleHeroClick = useCallback(
    (destination) => {
      navigate(destination);
    },
    [navigate],
  );

  const handleSectionNavigate = useCallback(
    (destination) => {
      navigate(destination);
    },
    [navigate],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      setCategoryError(null);

      try {
        const categoryData = await commonCodeService.getCategoryData();

        if (cancelled) {
          return;
        }

        const mainByName = {};
        const mainNameByCode = {};
        const subByName = {};
        const subToMain = {};

        categoryData.mainCategories
          .filter((category) => category.codeId !== "all")
          .forEach((category) => {
            mainByName[category.codeName] = category.codeId;
            mainNameByCode[category.codeId] = category.codeName;
          });

        Object.entries(categoryData.subCategoriesMap).forEach(([mainCode, subs]) => {
          subs
            .filter((sub) => sub.codeId !== "all")
            .forEach((sub) => {
              subByName[sub.codeName] = sub.codeId;
              subToMain[sub.codeId] = mainCode;
            });
        });

        setCategoryMappings({ mainByName, mainNameByCode, subByName, subToMain });
      } catch (error) {
        if (!cancelled) {
          console.error("카테고리 데이터 조회 실패", error);
          setCategoryError("카테고리 정보를 불러오지 못했습니다.");
        }
      } finally {
        // no-op
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // 이번 달 일일룩 데이터 로드
  useEffect(() => {
    let cancelled = false;

    const fetchDailyLooks = async () => {
      setIsLoadingDailyLooks(true);

      try {
        const currentMonth = new Date().toISOString().slice(0, 7); // 2025-10 형식
        const response = await getDailyLooksByMonth(currentMonth);

        if (cancelled) {
          return;
        }

        const dailyLookData = response?.data || [];
        setDailyLooks(dailyLookData);
      } catch (error) {
        if (!cancelled) {
          console.error("일일룩 데이터 조회 실패", error);
          setDailyLooks([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDailyLooks(false);
        }
      }
    };

    fetchDailyLooks();

    return () => {
      cancelled = true;
    };
  }, []);

  // 오늘 날씨 데이터 로드 (헤더용)
  useEffect(() => {
    let cancelled = false;

    const fetchTodayWeather = async () => {
      setIsLoadingTodayWeather(true);

      // 서울 좌표 (기본값)
      const lat = 37.5665;
      const lng = 126.978;
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      try {
        // getCurrentWeatherRange로 오늘 하루만 가져오기
        const weatherResult = await getCurrentWeatherRange({
          lat,
          lng,
          startDate: todayString,
          endDate: todayString,
        });

        if (cancelled) return;

        // 첫 번째 (오늘) 데이터 추출
        const todayData = {
          tmax: Math.round(weatherResult.temperature_2m_max[0]),
          tmin: Math.round(weatherResult.temperature_2m_min[0]),
          wcode: weatherResult.weathercode[0],
        };

        setTodayWeather(todayData);
      } catch (error) {
        if (!cancelled) {
          console.error("오늘 날씨 데이터 조회 실패:", error);
          setTodayWeather({ tmax: 24, tmin: 18, wcode: 0 }); // 기본값
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTodayWeather(false);
        }
      }
    };

    fetchTodayWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  // 이번 달 날씨 데이터 로드 (archive API 사용)
  useEffect(() => {
    let cancelled = false;

    const fetchMonthWeatherData = async () => {
      setIsLoadingWeather(true);

      // 서울 좌표 (기본값)
      const lat = 37.5665;
      const lng = 126.978;

      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // 이번 달 첫째 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // 로컬 시간 기준으로 날짜 문자열 생성
        const firstDayStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const lastDayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

        const weatherMap = {};
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        try {
          // 과거 날씨 데이터 (이번 달 첫날부터 어제까지)
          if (firstDayStr < todayStr) {
            const pastEndDate = new Date(today);
            pastEndDate.setDate(pastEndDate.getDate() - 1);
            const pastEndStr = `${pastEndDate.getFullYear()}-${String(pastEndDate.getMonth() + 1).padStart(2, "0")}-${String(pastEndDate.getDate()).padStart(2, "0")}`;

            // 과거 데이터 범위가 이번 달 범위와 겹치는 경우만 요청
            // 10월 1일 데이터 누락 방지를 위해 firstDayStr부터 시작
            if (firstDayStr <= pastEndStr) {
              const pastWeatherData = await getPastWeatherRange({
                lat,
                lng,
                startDate: firstDayStr, // 10월 1일부터
                endDate: pastEndStr, // 어제까지
              });

              // 과거 데이터 매핑 (이번 달에 속하는 날짜만)
              pastWeatherData.time.forEach((dateStr, index) => {
                // 이번 달에 속하는 날짜인지 확인
                if (dateStr >= firstDayStr && dateStr <= lastDayStr) {
                  weatherMap[dateStr] = {
                    tmax: Math.round(pastWeatherData.temperature_2m_max[index]),
                    tmin: Math.round(pastWeatherData.temperature_2m_min[index]),
                    wcode: pastWeatherData.weathercode[index],
                  };
                }
              });
            }
          }

          // 현재/미래 날씨 데이터 (오늘부터 최대 7일 예보까지만)
          if (todayStr <= lastDayStr) {
            // Open-Meteo forecast API는 최대 7일 예보만 제공
            const maxForecastDate = new Date(today);
            maxForecastDate.setDate(maxForecastDate.getDate() + 7);
            const maxForecastStr = `${maxForecastDate.getFullYear()}-${String(maxForecastDate.getMonth() + 1).padStart(2, "0")}-${String(maxForecastDate.getDate()).padStart(2, "0")}`;

            // 요청 종료일은 이번 달 마지막과 7일 예보 중 더 이른 날짜
            const forecastEndDate = lastDayStr < maxForecastStr ? lastDayStr : maxForecastStr;

            const currentWeatherData = await getCurrentWeatherRange({
              lat,
              lng,
              startDate: todayStr,
              endDate: forecastEndDate, // 7일 예보 제한 적용
            });

            // 현재/미래 데이터 매핑
            currentWeatherData.time.forEach((dateStr, index) => {
              weatherMap[dateStr] = {
                tmax: Math.round(currentWeatherData.temperature_2m_max[index]),
                tmin: Math.round(currentWeatherData.temperature_2m_min[index]),
                wcode: currentWeatherData.weathercode[index],
              };
            });
          }
        } catch (error) {
          console.warn("날씨 데이터 조회 실패, 기본값 사용:", error);

          // 실패 시 이번 달 모든 날짜에 기본값 설정
          for (let dateNum = 1; dateNum <= lastDay.getDate(); dateNum++) {
            const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dateNum).padStart(2, "0")}`;
            weatherMap[dateString] = {
              tmax: 20,
              tmin: 15,
              wcode: 0,
            };
          }
        }

        if (cancelled) return;

        setWeatherData(weatherMap);
      } catch (error) {
        if (!cancelled) {
          console.error("이번 달 날씨 데이터 조회 실패:", error);
          setWeatherData({});
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWeather(false);
        }
      }
    };

    fetchMonthWeatherData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchClothes = async () => {
      setIsLoadingClothes(true);
      setClothesError(null);

      try {
        const response = await clothesService.getUserClothes();
        if (cancelled) {
          return;
        }

        if (response.success && response.data) {
          setRawClothes(response.data);
        } else {
          setRawClothes([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("최근 착용한 옷 조회 실패", error);
          setRawClothes([]);
          setClothesError("옷 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingClothes(false);
        }
      }
    };

    fetchClothes();

    return () => {
      cancelled = true;
    };
  }, []);
  // ✅ 스크롤 기반 중앙 카드 확대 효과
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let lastActiveIndex = -1; // 이전 활성 인덱스 추적

    const handleScroll = () => {
      const cards = container.querySelectorAll(`.${styles.calendarCard}`);
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(centerX - cardCenter);

        const scale = Math.max(0.9, 1.0 - distance / 500);
        const opacity = Math.max(0.6, 1.1 - distance / 400);
        card.style.transform = `scale(${scale})`;
        card.style.opacity = opacity;
        card.style.transformOrigin = "center bottom";
        card.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveCalendarIndex(closestIndex);

      // 활성 인덱스가 변경된 경우에만 로그
      if (closestIndex !== lastActiveIndex && calendarData[closestIndex]) {
        lastActiveIndex = closestIndex;
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSnaps = async () => {
      setIsLoadingSnaps(true);
      setSnapError(null);

      try {
        const response = await postService.getAllPosts();

        if (cancelled) {
          return;
        }

        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];
        if (!items.length) {
          setSnaps([]);
          return;
        }
        const adapted = items.map((item, index) => ({
          id: item.postId || item.id || `snap-${index}`,
          image:
            item.imageUrls?.[0] ||
            item.imageUrl ||
            item.thumbnailUrl ||
            SNAP_FALLBACKS[index % SNAP_FALLBACKS.length],
          author: item.nickname || "CoordiFit 사용자", // API에서 받은 nickname 우선 사용
          profileImage: item.profileImageUrl || profileImage, // API에서 받은 profileImageUrl 우선 사용
          title: item.content || item.title || item.postTitle || "오늘의 데일리룩",
          likes:
            typeof item.likeCount === "number"
              ? item.likeCount
              : PLACEHOLDER_LIKES[index % PLACEHOLDER_LIKES.length],
          liked: item.liked || false,
        }));

        // 좋아요 수가 많은 순으로 정렬 후 상위 4개만 선택
        const sortedByLikes = adapted.sort((a, b) => b.likes - a.likes);
        setSnaps(sortedByLikes.slice(0, 4));
      } catch (error) {
        if (!cancelled) {
          console.error("스냅 게시물 조회 실패", error);
          setSnapError("스냅 게시물을 불러오지 못했습니다.");
          setSnaps([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSnaps(false);
        }
      }
    };

    fetchSnaps();

    return () => {
      cancelled = true;
    };
  }, []);

  const clothesWithMainCategory = useMemo(() => {
    if (!rawClothes.length) {
      return [];
    }

    return rawClothes.map((item) => {
      const categoryCode = item.categoryCode || "";

      // 서브 카테고리 코드로 메인 카테고리 찾기
      const derivedMainCode = categoryMappings.subToMain[categoryCode] || "";

      // 메인 카테고리 이름 가져오기
      const derivedMainName = categoryMappings.mainNameByCode[derivedMainCode] || "";

      return {
        ...item,
        mainCategoryCode: derivedMainCode,
        mainCategoryName: derivedMainName,
      };
    });
  }, [rawClothes, categoryMappings]);

  const activeRecentTabConfig = useMemo(
    () => RECENT_CATEGORY_TABS.find((tab) => tab.id === activeRecentTab) || RECENT_CATEGORY_TABS[0],
    [activeRecentTab],
  );

  const filteredRecentClothes = useMemo(() => {
    if (!clothesWithMainCategory.length) {
      return [];
    }

    const desiredMainLabel = activeRecentTabConfig.label;
    const fallbackMainId = activeRecentTabConfig.fallbackMainId;
    const desiredMainCode = categoryMappings.mainByName[desiredMainLabel] || fallbackMainId;

    return clothesWithMainCategory
      .filter((item) => {
        const itemMainCode = item.mainCategoryCode || "";

        // 메인 카테고리 코드로 비교
        if (itemMainCode && desiredMainCode && itemMainCode === desiredMainCode) {
          return true;
        }

        // 메인 카테고리 이름으로 비교
        const itemMainName = item.mainCategoryName || "";
        if (itemMainName && itemMainName === desiredMainLabel) {
          return true;
        }

        // categoryCode로 fallback (서브 카테고리 코드)
        if (item.categoryCode) {
          const fallbackValue = item.categoryCode.toLowerCase();
          return fallbackValue.includes(fallbackMainId);
        }

        return false;
      })
      .slice(0, 4);
  }, [
    activeRecentTabConfig,
    categoryMappings.mainByName,
    categoryMappings.mainNameByCode,
    clothesWithMainCategory,
  ]);

  const formattedClothes = useMemo(
    () =>
      filteredRecentClothes.map((item) => ({
        ...item,
        priceLabel:
          typeof item.price === "number" ? `${item.price.toLocaleString()}원` : (item.price ?? ""),
      })),
    [filteredRecentClothes],
  );

  const displaySnaps = useMemo(() => {
    if (snaps.length) {
      return snaps;
    }

    // 사용자 정보를 활용한 fallback 데이터 생성
    return SNAP_FALLBACKS.map((image, index) => ({
      id: `snap-fallback-${index}`,
      image,
      author: user?.nickname || "CoordiFit 사용자",
      profileImage: user?.profileImageUrl || profileImage,
      title: "오늘의 데일리룩",
      likes: PLACEHOLDER_LIKES[index % PLACEHOLDER_LIKES.length],
      liked: false,
    }));
  }, [snaps, user?.nickname]);

  // 캘린더 데이터를 API 데이터와 날씨 데이터로 합치기
  const calendarData = useMemo(() => {
    const monthDays = generateCurrentMonthDays();

    return monthDays.map((day) => {
      // API 데이터에서 해당 날짜의 일일룩 찾기 - wearDate에서 날짜 부분만 추출
      const dailyLookForDate = dailyLooks.find((look) => {
        if (!look.wearDate) return false;
        const lookDate = look.wearDate.slice(0, 10); // "2025-10-20 00:00:00" -> "2025-10-20"
        return lookDate === day.id;
      });

      // 날씨 데이터 가져오기
      const weather = weatherData[day.id];

      // 10월 1일 디버깅
      if (day.id === "2025-10-01") {
        const testIcon = getWeatherIcon(weather?.wcode);
      }

      const weatherIcon = weather ? getWeatherIcon(weather.wcode) : sunnyIcon;
      const weatherLabel = weather ? getWeatherLabel(weather.wcode) : "맑음";
      // 온도는 tmax와 tmin의 평균값으로 표시
      const temperature = weather ? `${Math.round((weather.tmax + weather.tmin) / 2)}°` : "20°";

      return {
        ...day,
        weatherIcon,
        weatherLabel,
        temperature,
        outfitImage: dailyLookForDate ? dailyLookForDate.thumbImageUrl : calendarPlus,
        dailyLookId: dailyLookForDate?.dailylookId,
        hasData: !!dailyLookForDate,
      };
    });
  }, [dailyLooks, weatherData]);
  // ✅ 오늘 날짜 카드 포커스 (끝일 때는 오른쪽 끝으로)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !calendarData.length) return;

    const timer = setTimeout(() => {
      const today = new Date();
      const todayDate = today.getDate();

      const todayIndex = calendarData.findIndex((day) => day.date === todayDate);
      if (todayIndex === -1) return;

      const cards = container.querySelectorAll(`.${styles.calendarCard}`);
      const targetCard = cards[todayIndex];
      if (!targetCard) return;

      const containerCenter = container.clientWidth / 2;
      const cardCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
      const totalCards = cards.length;

      let finalScrollPosition;

      // ✅ 1) 첫 주 (1~5일) → 왼쪽 시작 기준
      if (todayIndex < 4) {
        finalScrollPosition = 0;
      }
      // ✅ 2) 마지막 주 (예: 27~31일) → 오른쪽 끝 기준
      else if (todayIndex > totalCards - 5) {
        finalScrollPosition = container.scrollWidth - container.clientWidth;
      }
      // ✅ 3) 중간 날짜 → 중앙 정렬
      else {
        finalScrollPosition = cardCenter - containerCenter;
      }

      // 범위 보정
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (finalScrollPosition < 0) finalScrollPosition = 0;
      if (finalScrollPosition > maxScroll) finalScrollPosition = maxScroll;

      container.scrollTo({
        left: finalScrollPosition,
        behavior: "smooth",
      });

      setActiveCalendarIndex(todayIndex);
    }, 200);

    return () => clearTimeout(timer);
  }, [calendarData]);

  // ✅ 스크롤 시 중앙 카드 확대 효과
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const cards = container.querySelectorAll(`.${styles.calendarCard}`);
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(centerX - cardCenter);
        const scale = Math.max(0.9, 1.0 - distance / 500);
        const opacity = Math.max(0.6, 1.1 - distance / 400);
        card.style.transform = `scale(${scale})`;
        card.style.opacity = opacity;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveCalendarIndex(closestIndex);
    };
    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const canNavigateSnap = snaps.length > 0;

  const resolveShortcutCodes = useCallback(
    (shortcut) => {
      const mainCode = categoryMappings.mainByName[shortcut.mainLabel] || shortcut.fallbackMainId;
      const subCode = [shortcut.subLabel, ...(shortcut.subLabelAlternatives || [])]
        .map((name) => categoryMappings.subByName[name])
        .find(Boolean);

      return {
        mainCode,
        subCode: subCode || shortcut.fallbackSubId,
      };
    },
    [categoryMappings.mainByName, categoryMappings.subByName],
  );

  const handleCategoryShortcut = useCallback(
    (shortcut) => {
      const { mainCode, subCode } = resolveShortcutCodes(shortcut);

      navigate("/closet", {
        state: {
          selectedMainCategory: mainCode,
          selectedSubCategory: subCode,
          mainCategoryName: shortcut.mainLabel,
          subCategoryName: shortcut.subLabel,
          fallbackMainId: shortcut.fallbackMainId,
          fallbackSubId: shortcut.fallbackSubId,
        },
      });
    },
    [navigate, resolveShortcutCodes],
  );

  const handleToggleSnapLike = useCallback(async (snapId, event) => {
    event.stopPropagation(); // 또는 카드 클릭 이벤트 방지

    // 즉시 UI 업데이트
    setSnaps((prevSnaps) =>
      prevSnaps.map((snap) =>
        snap.id === snapId
          ? {
              ...snap,
              liked: !snap.liked,
              likes: snap.liked ? snap.likes - 1 : snap.likes + 1,
            }
          : snap,
      ),
    );

    try {
      await postService.togglePostLike(snapId);
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      // 오류 시 원래 상태로 되돌리기
      setSnaps((prevSnaps) =>
        prevSnaps.map((snap) =>
          snap.id === snapId
            ? {
                ...snap,
                liked: !snap.liked,
                likes: snap.liked ? snap.likes + 1 : snap.likes - 1,
              }
            : snap,
        ),
      );
    }
  }, []);

  const handleClothesItemClick = useCallback(
    (clothesId) => {
      navigate(`/closet/item/${clothesId}`);
    },
    [navigate],
  );

  const handleCalendarCardClick = useCallback(
    (day) => {
      // 네비게이션 전에 한 번 더 확인
      const navigationPath = `/calendar/${day.id}`;

      // 해당 날짜로 달력 페이지에 이동 (URL 경로에 날짜 포함)
      navigate(navigationPath);
    },
    [navigate],
  );

  return (
    <div className={styles.page}>
      <div className={styles.topHero}>
        <header className={styles.appHeader}>
          <div className={styles.brandGroup}>
            <p className={styles.brandLogo}>CoordiFit</p>
            <div className={styles.weatherInline}>
              {!isLoadingTodayWeather && todayWeather ? (
                <>
                  <img
                    src={getWeatherIcon(todayWeather.wcode)}
                    alt={getWeatherLabel(todayWeather.wcode)}
                    className={styles.weatherIcon}
                  />
                  <span className={styles.temperature}>
                    {Math.round((todayWeather.tmax + todayWeather.tmin) / 2)}°
                  </span>
                </>
              ) : (
                <>
                  <img src={sunnyIcon} alt="맑음" className={styles.weatherIcon} />
                  <span className={styles.temperature}>24°</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.profileButton}
            onClick={() => navigate("/mypage")}
            aria-label="마이페이지로 이동"
          >
            <img src={userIcon} alt="프로필 아이콘" />
          </button>
        </header>
        <div className={styles.heroCarousel}>
          {HERO_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`${styles.heroCard} ${card.id === "snap" ? styles.snapHeroCard : ""}`}
              onClick={() => handleHeroClick(card.destination)}
            >
              <img
                src={card.image}
                alt={`${card.subtitle} 배너`}
                className={styles.heroImage}
                style={card.id === "snap" ? { opacity: 0.6 } : undefined}
              />{" "}
              <div className={styles.heroTextBox}>
                <h2
                  className={styles.heroTitle}
                  dangerouslySetInnerHTML={{
                    __html: card.title.replace(/,\s*/g, ",<br />"),
                  }}
                />
                <p className={styles.heroSubtitle}>{card.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2>나의 옷장</h2>
            <img src={closetIcon} alt="옷장" />
          </div>
          <button
            type="button"
            className={styles.sectionLink}
            onClick={() => handleSectionNavigate("/closet")}
          >
            옷장 전체 보기
          </button>
        </header>

        <div className={styles.categoryGrid}>
          {CATEGORY_ROWS.map((row) => (
            <div className={styles.categoryRow} key={row.map((item) => item.id).join("-")}>
              {row.map((filter) => (
                <div key={filter.id} className={styles.categoryItem}>
                  <button
                    type="button"
                    className={styles.categoryButton}
                    onClick={() => handleCategoryShortcut(filter)}
                    aria-label={`${filter.label} 카테고리 보러가기`}
                  >
                    <div className={styles.categoryImageBox}>
                      <img src={filter.image} alt={filter.label} className={styles.categoryImage} />
                    </div>
                  </button>
                  <span className={styles.categoryLabel}>{filter.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ✅ 코디 캘린더 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2>코디 캘린더</h2>
            <img src={calendarIcon} alt="캘린더" />
          </div>
          <button
            type="button"
            className={styles.sectionLink}
            onClick={() => navigate("/calendar")}
          >
            달력 보기
          </button>
        </header>

        <div ref={scrollRef} className={styles.calendarScroller}>
          {calendarData.map((day, index) => (
            <div
              key={day.id}
              className={`${styles.calendarCard} ${
                index === activeCalendarIndex ? styles.activeCalendarCard : ""
              }`}
              data-extra={day.isExtra}
              onClick={() => !day.isExtra && handleCalendarCardClick(day)}
            >
              <div className={styles.calendarCardHeader}>
                <div>
                  <span className={styles.calendarDay}>{day.day}</span>
                  <span className={styles.calendarDate}>{day.date}</span>
                </div>
                <div className={styles.calendarWeather}>
                  {day.weatherIcon && (
                    <img
                      src={day.weatherIcon}
                      alt={`${day.weatherLabel} 아이콘`}
                      className={styles.calendarWeatherIcon}
                    />
                  )}
                  <span className={styles.calendarTemp}>{day.temperature}</span>
                </div>
              </div>
              <div className={styles.calendarCardBody}>
                {day.hasData && day.outfitImage ? (
                  <img src={day.outfitImage} alt={`${day.date}일 코디`} />
                ) : (
                  <img
                    src={calendarPlus}
                    alt="코디 추가하기"
                    className={styles.calendarAdd}
                    style={{ width: "30px", height: "30px" }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.aiSection}`}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2>AI 옷 입히기</h2>
            <img src={aiIcon} alt="AI" />
          </div>
        </header>

        <button
          type="button"
          className={styles.aiBannerButton}
          onClick={() => handleSectionNavigate("/ai-fitting")}
          style={{ backgroundImage: `url(${aiBanner})` }}
        >
          <div className={styles.aiBannerOverlay} aria-hidden="true" />

          {/* 내부 배너 컨텐츠 */}
          <div className={styles.aiBannerContent}>
            <p className={styles.aiBannerHeadline}>
              <strong className={styles.aiHighlight}>AI </strong>
              <span>피팅으로 완벽한 스타일을 찾아보세요.</span>
            </p>

            <div className={styles.aiBannerActionWrapper}>
              <span className={styles.aiBannerAction}>+ 가상 피팅하기</span>
            </div>
          </div>
        </button>
      </section>

      {/* ✅ 최근에 착용한 옷 섹션 */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2>최근에 착용한 옷</h2>
            <img src={lastWornIcon} alt="최근 착용" />
          </div>
          <button
            type="button"
            className={styles.sectionLink}
            onClick={() => handleSectionNavigate("/closet")}
          >
            옷장 가기
          </button>
        </header>

        {categoryError && <p className={styles.errorText}>{categoryError}</p>}

        {/* ✅ 좌우 여백 제거용 래퍼 */}
        <div className={styles.recentTabsWrapper}>
          <div className={styles.recentTabs} role="tablist" aria-label="최근에 착용한 옷 카테고리">
            {RECENT_CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={
                  tab.id === activeRecentTab
                    ? `${styles.recentTab} ${styles.activeRecentTab}`
                    : styles.recentTab
                }
                onClick={() => setActiveRecentTab(tab.id)}
                aria-pressed={tab.id === activeRecentTab}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 아래 옷 리스트 영역 */}

        {clothesError && <p className={styles.errorText}>{clothesError}</p>}
        <div className={styles.clothesGrid}>
          {isLoadingClothes
            ? Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className={`${styles.clothesCard} ${styles.skeleton}`}
                />
              ))
            : formattedClothes.length > 0
              ? formattedClothes.map((item) => (
                  <div
                    className={styles.clothesCard}
                    key={item.clothesId}
                    onClick={() => handleClothesItemClick(item.clothesId)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.clothesImageWrapper}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={`${item.name} 이미지`} />
                      ) : (
                        <span className={styles.imagePlaceholder}>이미지 없음</span>
                      )}
                    </div>
                    <div className={styles.clothesMeta}>
                      <span className={styles.brand}>{item.brand || "브랜드 미입력"}</span>
                      <strong className={styles.clothesName}>{item.name || "이름 없음"}</strong>
                      {item.priceLabel && <span className={styles.price}>{item.priceLabel}</span>}
                    </div>
                  </div>
                ))
              : !clothesError && (
                  <div className={styles.emptyState}>
                    <p>선택한 카테고리에 등록된 옷이 없습니다.</p>
                    <p>옷장에서 새로운 아이템을 추가해보세요!</p>
                  </div>
                )}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2>실시간 인기 스냅</h2>
            <img src={snapIcon} alt="스냅" />
          </div>
          <button
            type="button"
            className={styles.sectionLink}
            onClick={() => handleSectionNavigate("/snap")}
          >
            게시글 보기
          </button>
        </header>
        {snapError && <p className={styles.errorText}>{snapError}</p>}
        <div className={styles.snapGrid}>
          {isLoadingSnaps
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`snap-skeleton-${index}`}
                  className={`${styles.snapCard} ${styles.skeleton}`}
                  aria-hidden="true"
                />
              ))
            : displaySnaps.map((snap) => (
                <div
                  key={snap.id}
                  className={styles.snapCard}
                  onClick={() => canNavigateSnap && handleSectionNavigate(`/snap/${snap.id}`)}
                  style={{ cursor: canNavigateSnap ? "pointer" : "default" }}
                >
                  <div className={styles.snapImageWrapper}>
                    <img src={snap.image} alt={`${snap.title} 스냅 이미지`} />
                    <button
                      type="button"
                      className={styles.snapLikeIcon}
                      onClick={(e) => handleToggleSnapLike(snap.id, e)}
                      aria-label={snap.liked ? "좋아요 취소" : "좋아요"}
                    >
                      <img
                        src={snap.liked ? heartRed : heartBlack}
                        alt={snap.liked ? "좋아요 됨" : "좋아요 안됨"}
                      />
                    </button>
                  </div>
                  <div className={styles.snapMeta}>
                    <div className={styles.snapAuthorInfo}>
                      <img
                        src={snap.profileImage}
                        alt={`${snap.author} 프로필`}
                        className={styles.snapAuthorProfile}
                      />
                      <span className={styles.snapAuthor}>{snap.author}</span>
                    </div>
                    <p className={styles.snapTitle}>{snap.title}</p>
                    <span className={styles.snapLikes}>❤️ {snap.likes.toLocaleString()}</span>
                  </div>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
};

export default MainPage;
