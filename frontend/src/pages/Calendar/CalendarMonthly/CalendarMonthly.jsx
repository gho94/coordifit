import { useDailyLooksByMonthQuery, useDailylookSummaryQuery } from "@/hooks/useDailyLookQuery";
import { formatDate, formatYearMonth } from "@/utils/calendarUtils";
import Calendar from "react-calendar";
import { useNavigate } from "react-router-dom";

import styles from "./CalendarMonthly.module.css";
import classNames from "classnames/bind";
import { useClothesStore } from "@/stores/clothesStore";

const cx = classNames.bind(styles);

const CalendarMonthly = ({ targetDate, date, setTargetDate, setViewMode, handleClickDay }) => {
  const navigate = useNavigate();

  const { data: dailyLooks = { data: [] }, isLoading, error } = useDailyLooksByMonthQuery(date);

  const isYearMonth = (string) => /^\d{4}-\d{2}$/.test(string);
  const {
    data: summary = {
      data: {
        mostWornClothesOverall: null,
        mostWornClothesThisMonth: null,
        totalDailyLookCount: 0,
      },
    },
    isLoading: isLoadingSummary,
  } = useDailylookSummaryQuery(isYearMonth ? date : undefined);

  const { clearClothes } = useClothesStore();

  const trimDate = (datetime) => datetime.split(" ")[0];

  if (isLoading) {
    return (
      <div className={cx("loadingWrap")}>
        <div className={cx("spinner")} />
        <p className={cx("loadingTitle")}>달력 데이터를 불러오는 중</p>
        <p className={cx("loadingSub")}>잠시만 기다려 주세요…</p>
      </div>
    );
  }

  if (error)
    return (
      <>
        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
        <span>error</span>
      </>
    );

  return (
    <>
      {isYearMonth(date) && (
        <Calendar
          locale="en-US"
          formatShortWeekday={(locale, date) =>
            ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
          }
          value={targetDate}
          onClickDay={handleClickDay}
          showNeighboringMonth={false}
          showNavigation={false}
          tileClassName={({ date, view }) => {
            if (view !== "month") return null;
            const day = date.getDay();
            if (day === 0) return "sunday";
            if (day === 6) return "saturday";
          }}
          tileContent={({ date, view }) => {
            if (view !== "month") return null;
            const target = dailyLooks.data.find(
              (item) => trimDate(item.wearDate) === formatDate(date),
            );
            if (!target) return null;

            return (
              <div className={cx("calendar-thumb-wrapper")}>
                <img
                  src={target.thumbImageUrl}
                  alt=""
                  className={cx("calendar-thumb")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode("daily");
                    clearClothes();
                    setTargetDate(new Date(target.wearDate));
                    navigate(`/calendar/${formatDate(new Date(target.wearDate))}`);
                  }}
                />
              </div>
            );
          }}
        />
      )}
      <div className={cx("summaryRow")}>
        <button type="button" className={cx("summaryCard")} disabled>
          <div className={cx("summaryTitle")}>데일리룩</div>
          <div className={cx("summaryCount", "accent")}>
            {summary?.data?.totalDailyLookCount ?? 0}개
          </div>
        </button>
        <button
          type="button"
          className={cx("summaryCard")}
          disabled={!summary?.data?.mostWornClothesOverall?.clothesId}
          onClick={() => {
            const id = summary?.data?.mostWornClothesOverall?.clothesId;
            if (id) navigate(`/closet/item/${id}`);
          }}
        >
          <div className={cx("summaryTitle")}>가장 많이 입은 옷</div>
          <div className={cx("summaryThumbBox")}>
            {summary.data.mostWornClothesOverall?.imageUrl ? (
              <img
                className={cx("summaryThumb")}
                src={summary?.data?.mostWornClothesOverall.imageUrl}
                alt={summary?.data?.mostWornClothesOverall?.name || "most worn overall"}
              />
            ) : (
              <div className={cx("summaryThumbSkeleton")}>
                <span className={cx("summaryEmptyText")}>데이터 없음</span>
              </div>
            )}
          </div>
        </button>
        <button
          type="button"
          className={cx("summaryCard")}
          disabled={!summary?.data?.mostWornClothesThisMonth?.clothesId}
          onClick={() => {
            const id = summary?.data?.mostWornClothesThisMonth?.clothesId;
            if (id) navigate(`/closet/item/${id}`);
          }}
        >
          <div className={cx("summaryTitle")}>이번 달 많이 입은 옷</div>
          <div className={cx("summaryThumbBox")}>
            {summary?.data?.mostWornClothesThisMonth?.imageUrl ? (
              <img
                className={cx("summaryThumb")}
                src={summary?.data?.mostWornClothesThisMonth?.imageUrl}
                alt={summary?.data?.mostWornClothesThisMonth?.name || "most worn this month"}
              />
            ) : (
              <div className={cx("summaryThumbSkeleton")}>
                <span className={cx("summaryEmptyText")}>데이터 없음</span>
              </div>
            )}
          </div>
        </button>
      </div>
    </>
  );
};

export default CalendarMonthly;
