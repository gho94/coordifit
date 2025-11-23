// App.jsx
import { createBrowserRouter, Navigate, RouterProvider, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import Layout from "@/components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import AiFittingLanding from "@/pages/AiFitting/AiFittingLanding";
import AiFittingResultPage from "@/pages/AiFitting/AiFittingResultPage";
import AvatarCreationPage from "@/pages/AiFitting/AvatarCreationPage";
import AvatarSelectionPage from "@/pages/AiFitting/AvatarSelectionPage";

import CalendarLayout from "@calendar/CalendarLayout/CalendarLayout";
import CalendarBody from "@calendar/CalendarBody/CalendarBody";
import CalendarEditor from "@calendar/CalendarEditor/CalendarEditor";

import ClosetPage from "@/pages/ClosetPage/ClosetPage";
import ClosetDetailPage from "@/pages/ClosetPage/ClosetDetailPage";
import ClosetRegisterPage from "@/pages/ClosetPage/ClosetRegisterPage";
import OcrPage from "@/pages/OcrPage/OcrPage";
import OcrAnalyzingPage from "@/pages/OcrAnalyzingPage/OcrAnalyzingPage";
import OcrResultPage from "@/pages/OcrResultPage/OcrResultPage";

import LoginPage from "@/pages/LoginPage/LoginPage";
import MainPage from "@/pages/MainPage/MainPage";
import PasswordReset from "@/pages/PasswordResetPage/PasswordResetPage";
import SignUpPage from "@/pages/SignUpPage/SignUpPage";

import SnapPage from "@/pages/SnapPage/SnapPage";
import SnapAddPage from "@/pages/SnapPage/SnapAddPage";
import SnapUploadCompletePage from "@/pages/SnapPage/SnapUploadCompletePage";
import SnapDetailPage from "@/pages/SnapPage/SnapDetailPage";
import Start from "@/pages/Start/Start";
import MyPage from "@/pages/MyPage/MyPage";
import ProfileEditPage from "@/pages/ProfileEditPage/ProfileEditPage";
import CommonCodePage from "@/pages/CommonCodePage/CommonCodePage";

import CoordiEditor from "./pages/Closet/CoordiEditor/CoordiEditor";
import CoordiDetail from "./pages/Closet/CoordiDetail/CoordiDetail";

import { TokenManager } from "./services/axiosInstance";
import { formatYearMonth } from "./utils/calendarUtils";

const AutoLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (TokenManager.isLoggedIn()) {
      navigate("/main");
    } else {
      navigate("/start");
    }
  }, [navigate]);

  return null;
};

// 라우터 정의
const router = createBrowserRouter([
  // 풀스크린 계열 → Layout 안 쓰니까 handle 필요 없음
  { path: "/", element: <AutoLogin /> },
  { path: "/start", element: <Start /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/common-codes", element: <CommonCodePage /> },

  // Layout 내부 페이지들
  {
    element: <Layout />,
    children: [
      // ✅ 회원가입 페이지 (헤더 + 뒤로가기만 표시)
      {
        path: "/signup",
        element: <SignUpPage />,
        handle: {
          title: "회원가입",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
      // ✅ 비밀번호 재설정 페이지 (헤더 + 뒤로가기만 표시)
      {
        path: "/password-reset",
        element: <PasswordReset />,
        handle: {
          title: "비밀번호 재설정",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },

      // 루트 탭들: 헤더+탭 / 뒤로가기 없음
      {
        path: "/main",
        element: (
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        ),
        handle: {
          showBack: false,
          showHeader: false,
          showTabbar: true,
        },
      },
      {
        path: "/calendar",
        element: (
          <ProtectedRoute>
            <CalendarLayout />
          </ProtectedRoute>
        ),
        handle: {
          title: "코디 캘린더",
          showBack: false,
          showHeader: false,
          showTabbar: true,
          padding: "none",
        },
        children: [
          {
            index: true,
            element: <Navigate to={`/calendar/${formatYearMonth(new Date())}`} replace />,
          },
          {
            path: ":date",
            element: <CalendarBody />,
          },
        ],
      },
      {
        path: "/calendar/:date/editor",
        element: (
          <ProtectedRoute>
            <CalendarEditor />
          </ProtectedRoute>
        ),
        handle: {
          title: "데일리룩 편집",
          showBack: true,
          showHeader: true,
          showTabbar: true,
          padding: "none",
        },
      },
      {
        path: "/closet/coordi/editor",
        element: (
          <ProtectedRoute>
            <CoordiEditor />
          </ProtectedRoute>
        ),
        handle: {
          title: "코디 만들기",
          showBack: true,
          showHeader: true,
          showTabbar: false,
          padding: "none",
        },
      },
      {
        path: "/closet/coordi/editor/:coordiId",
        element: (
          <ProtectedRoute>
            <CoordiEditor />
          </ProtectedRoute>
        ),
        handle: {
          title: "코디 수정하기",
          showBack: true,
          showHeader: true,
          showTabbar: false,
          padding: "none",
        },
      },
      {
        path: "/closet/coordi/:coordiId",
        element: (
          <ProtectedRoute>
            <CoordiDetail />
          </ProtectedRoute>
        ),
        handle: {
          title: "코디 상세정보",
          showBack: true,
          showHeader: true,
          showTabbar: false,
          padding: "none",
        },
      },
      {
        path: "/closet",
        element: (
          <ProtectedRoute>
            <ClosetPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "내 옷장",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/closet/item/:itemId",
        element: (
          <ProtectedRoute>
            <ClosetDetailPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "옷 상세보기",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/closet/register",
        element: (
          <ProtectedRoute>
            <ClosetRegisterPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "옷 등록",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
      {
        path: "/closet/ocr",
        element: (
          <ProtectedRoute>
            <OcrPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "구매 내역 등록하기",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
      {
        path: "/closet/ocr/analyzing",
        element: (
          <ProtectedRoute>
            <OcrAnalyzingPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "구매 내역 분석",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
      {
        path: "/closet/ocr/result",
        element: (
          <ProtectedRoute>
            <OcrResultPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "구매내역 분석 결과",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/mypage",
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
        handle: {
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/mypage/:userId",
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
        handle: {
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/snap",
        element: (
          <ProtectedRoute>
            <SnapPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "스냅",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/profile/edit",
        element: (
          <ProtectedRoute>
            <ProfileEditPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "프로필 수정",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/ai-fitting",
        element: (
          <ProtectedRoute>
            <AiFittingLanding />
          </ProtectedRoute>
        ),
        handle: {
          title: "AI 피팅",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/ai-fitting/result",
        element: (
          <ProtectedRoute>
            <AiFittingResultPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "AI 피팅 결과",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/ai-fitting/avatars",
        element: (
          <ProtectedRoute>
            <AvatarSelectionPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "아바타 선택",
          showBack: true,
          showHeader: true,
          showTabbar: true,
        },
      },
      {
        path: "/ai-fitting/avatars/new",
        element: (
          <ProtectedRoute>
            <AvatarCreationPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "아바타 만들기",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
      {
        path: "/snap/add",
        element: (
          <ProtectedRoute>
            <SnapAddPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "스냅 업로드",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
      {
        path: "/snap/upload-complete",
        element: (
          <ProtectedRoute>
            <SnapUploadCompletePage />
          </ProtectedRoute>
        ),
        handle: {
          title: "스냅 업로드",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
      {
        path: "/snap/:postId",
        element: (
          <ProtectedRoute>
            <SnapDetailPage />
          </ProtectedRoute>
        ),
        handle: {
          title: "스냅",
          showBack: true,
          showHeader: true,
          showTabbar: false,
        },
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
