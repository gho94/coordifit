import { createRoot } from "react-dom/client";
import "@/styles/global.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register"; // ✅ vite-plugin-pwa가 자동 생성해줌

const queryClient = new QueryClient();

// ✅ 서비스워커 등록
registerSW({
  onNeedRefresh() {
    if (confirm("새 버전이 있습니다. 새로고침할까요?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("💾 오프라인에서도 CoordiFit 사용 가능합니다!");
  },
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
