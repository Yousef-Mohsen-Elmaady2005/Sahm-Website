export function isCommercialProfileResponse(responseData) {
  const data = responseData?.data ?? responseData ?? {};
  const profile = data?.main_data ?? data?.user ?? data?.profile ?? data;
  const accountType = profile?.type_id ?? profile?.user_type_id ?? profile?.type?.id ?? profile?.type;
  const accountTypeLabel = [
    profile?.type_title,
    profile?.user_type_title,
    profile?.user_type?.title,
    profile?.account_type?.title,
    typeof profile?.type === "string" ? profile.type : "",
  ].filter(Boolean).join(" ").toLocaleLowerCase();

  return String(accountType) === "2" || /commercial|company|تجاري|شركة/.test(accountTypeLabel);
}
