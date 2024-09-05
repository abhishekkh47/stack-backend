export const mapHasGoalKey = (profile: any, key: string) => {
  if (profile.has(key)) {
    const value = profile.get(key);
    if (value?.title || value?.length) return true;
  }
  return false;
};

export const hasGoalKey = (profile: any, key: string) =>
  profile?.[key]?.title || profile?.[key]?.length;
