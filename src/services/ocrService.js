import { fastApi, api } from "./axiosInstance";

const ocrService = {
  // 1단계: FastAPI로 OCR 텍스트 추출
  async extractText(imageFile) {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fastApi.post("/api/ocr/extract", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 240000, // 60초 타임아웃
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("OCR 텍스트 추출 실패:", error);
      return {
        success: false,
        message: error.response?.data?.detail || "OCR 분석에 실패했습니다.",
        error: error.response?.data || error.message,
      };
    }
  },

  // 2단계: Spring Boot ChatGPT API로 OCR 결과 분석
  async analyzeOcrResult(ocrResults) {
    try {
      console.log("🤖 ChatGPT 분석 시작...");
      console.log("📄 OCR 결과:", {
        count: ocrResults?.length || 0,
        results: ocrResults,
      });

      const requestData = {
        ocrResult: {
          results: ocrResults,
        },
        hint: "주문내역에서 상품 정보를 추출해주세요",
      };

      console.log("📤 ChatGPT API 요청 데이터:", requestData);
      console.log("🌐 요청 URL:", api.defaults.baseURL + "/ocr/analysis");

      // JWT 토큰 확인
      const token = localStorage.getItem("accessToken");
      console.log("🔑 JWT 토큰 존재:", !!token);
      if (token) {
        console.log("🔑 JWT 토큰 앞 20자:", token.substring(0, 20) + "...");
      }

      const response = await api.post("/ocr/analysis", requestData);

      console.log("✅ ChatGPT 분석 성공:", {
        status: response.status,
        data: response.data,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ ChatGPT 분석 실패:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        baseURL: api.defaults.baseURL,
        url: "/api/ocr/analysis",
        fullUrl: api.defaults.baseURL + "/api/ocr/analysis",
      });
      return {
        success: false,
        message: error.response?.data?.message || "ChatGPT 분석에 실패했습니다.",
        error: error.response?.data || error.message,
      };
    }
  },

  // 전체 OCR + ChatGPT 분석 통합 메서드
  async analyzeImage(imageFile) {
    try {
      console.log("🚀 이미지 분석 시작 - 전체 프로세스");

      // 1단계: OCR 텍스트 추출
      console.log("1️⃣ 1단계: OCR 텍스트 추출 시작");
      const ocrResult = await this.extractText(imageFile);

      if (!ocrResult.success) {
        console.error("❌ 1단계 실패 - OCR 추출:", ocrResult);
        return ocrResult;
      }

      console.log("✅ 1단계 완료 - OCR 추출 성공:", {
        count: ocrResult.data?.count,
        hasResults: !!ocrResult.data?.results,
      });

      // 2단계: ChatGPT로 상품 정보 분석
      console.log("2️⃣ 2단계: ChatGPT 분석 시작");
      const analysisResult = await this.analyzeOcrResult(ocrResult.data.results);

      if (!analysisResult.success) {
        console.error("❌ 2단계 실패 - ChatGPT 분석:", analysisResult);
        return analysisResult;
      }

      console.log("✅ 2단계 완료 - ChatGPT 분석 성공:", {
        hasProducts: !!analysisResult.data?.products,
        productCount: analysisResult.data?.products?.length || 0,
      });

      const finalResult = {
        success: true,
        data: {
          ocrData: ocrResult.data,
          analysisResult: analysisResult.data,
        },
      };

      console.log("🎉 전체 분석 완료:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("💥 이미지 분석 실패 - 예외 발생:", {
        message: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: error.message || "이미지 분석에 실패했습니다.",
        error: error,
      };
    }
  },
};

export default ocrService;
