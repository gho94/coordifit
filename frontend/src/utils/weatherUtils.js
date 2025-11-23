const mergeDaily = (past, future) => {
  return {
    time: [...(past?.time || []), ...(future?.time || [])],
    temperature_2m_max: [
      ...(past?.temperature_2m_max || []),
      ...(future?.temperature_2m_max || []),
    ],
    temperature_2m_min: [
      ...(past?.temperature_2m_min || []),
      ...(future?.temperature_2m_min || []),
    ],
    weathercode: [...(past?.weathercode || []), ...(future?.weathercode || [])],
  };
};

export { mergeDaily };
