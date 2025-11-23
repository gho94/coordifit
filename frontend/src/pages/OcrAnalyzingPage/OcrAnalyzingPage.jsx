import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./OcrAnalyzingPage.module.css";
import autoAwesomeIcon from "@/assets/images/auto_awesome.png";
import ocrService from "@/services/ocrService";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

const OcrAnalyzingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("ocr"); // 'ocr', 'chatgpt', 'complete'
  const isAnalyzing = useRef(false); // 중복 실행 방지
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedFile = location.state?.selectedFile;

  const analyzeImage = useCallback(async () => {
    if (!selectedFile || isAnalyzing.current) return;

    isAnalyzing.current = true;

    try {
      // 1단계: OCR 텍스트 추출
      setCurrentStep("ocr");
      setProgress(20);

      const ocrResult = await ocrService.extractText(selectedFile);

      if (!ocrResult.success) {
        throw new Error(ocrResult.message);
      }

      setProgress(60);

      // 2단계: ChatGPT로 상품 정보 분석 (즉시 처리)
      setCurrentStep("chatgpt");

      const chatgptResult = await ocrService.analyzeOcrResult(ocrResult.data.results);

      if (!chatgptResult.success) {
        throw new Error(chatgptResult.message);
      }

      setProgress(100);
      setCurrentStep("complete");

      console.log("🎯 결과 페이지로 전달할 데이터:", {
        originalImage: selectedFile,
        ocrData: ocrResult.data,
        analysisResult: chatgptResult.data,
      });

      // 즉시 이동 (딜레이 제거)
      navigate("/closet/ocr/result", {
        state: {
          originalImage: selectedFile,
          ocrData: ocrResult.data,
          analysisResult: chatgptResult.data,
        },
      });
    } catch (error) {
      console.error("분석 실패:", error);
      setErrorMessage(`분석에 실패했습니다: ${error.message}`);
      setShowErrorModal(true);
      setTimeout(() => {
        navigate("/closet/ocr");
      }, 2000);
    } finally {
      isAnalyzing.current = false;
    }
  }, [selectedFile, navigate]);

  useEffect(() => {
    if (!selectedFile) {
      navigate("/closet/ocr");
      return;
    }

    analyzeImage();
  }, [selectedFile, analyzeImage]);

  const handleBack = () => {
    navigate("/closet/ocr");
  };

  const getStepMessage = () => {
    switch (currentStep) {
      case "ocr":
        return "이미지에서 텍스트를 추출하고 있습니다...";
      case "chatgpt":
        return "AI가 상품 정보를 분석하고 있습니다...";
      case "complete":
        return "분석이 완료되었습니다!";
      default:
        return "분석을 준비하고 있습니다...";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.analyzingSection}>
          <div className={styles.sparkleIcon}>
            <img src={autoAwesomeIcon} alt="분석중" className={styles.sparkleImage} />
          </div>
          <div className={styles.receiptPreview}>
            {selectedFile && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="분석중인 영수증"
                className={styles.receiptImage}
              />
            )}
            <div className={styles.highlightOverlay}></div>
          </div>
          <h2 className={styles.analyzingTitle}>AI가 사진을 분석중입니다.</h2>
          <p className={styles.analyzingSubtitle}>최대 1분정도 소요될 수 있습니다.</p>

          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
            </div>
            <div className={styles.progressText}>{progress}%</div>
          </div>

          <div className={styles.stepMessage}>{getStepMessage()}</div>
        </div>
      </div>

      {/* 오류 모달 */}
      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title="오류"
        message={errorMessage}
        confirmText="확인"
        cancelText=""
      />
    </div>
  );
};

export default OcrAnalyzingPage;
