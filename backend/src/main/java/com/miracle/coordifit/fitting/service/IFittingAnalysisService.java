package com.miracle.coordifit.fitting.service;

import com.miracle.coordifit.fitting.dto.FittingAnalysisRequest;
import com.miracle.coordifit.fitting.dto.FittingAnalysisResponse;

public interface IFittingAnalysisService {
	FittingAnalysisResponse analyze(FittingAnalysisRequest request);
}
