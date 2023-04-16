export const handler = async (event) => {
  return {
    isAuthorized: true,
    ttlOverride: 60 * 60 * 24,
  };
};
