export const mapHasGoalKey = (profile: any, key: string) => {
  if (profile && profile?.key) {
    const value = profile.key;
    if (value?.title || value?.length) return true;
  }
  return false;
};

export const hasGoalKey = (profile: any, key: string) =>
  profile?.[key]?.title || profile?.[key]?.length;
