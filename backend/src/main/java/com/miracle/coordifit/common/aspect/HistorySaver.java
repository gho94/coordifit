package com.miracle.coordifit.common.aspect;

public interface HistorySaver {

	void saveHistory(Object result, String actionType, String userId);

	String getSupportedEntityType();
}
