import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getProfile } from "../api/auth";
import MyConstructions from "../Component/MyConstructions";
import CompanyPropertyRequests from "./CompanyPropertyRequests";
import { isCommercialProfileResponse } from "../utils/accountType";
import { t } from "../i18n";

export default function AccountRequests({ ownRequestsOnly = false }) {
  const [isCommercialAccount, setIsCommercialAccount] = useState(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then(({ data }) => {
        if (active) setIsCommercialAccount(isCommercialProfileResponse(data));
      })
      .catch(() => {
        if (active) setIsCommercialAccount(false);
      });
    return () => { active = false; };
  }, []);

  if (isCommercialAccount === null) {
    return <p role="status" className="py-12 text-center text-slate-500">{t("جاري تحميل البيانات...")}</p>;
  }
  if (ownRequestsOnly && !isCommercialAccount) return <Navigate to="/account/requests" replace />;
  if (ownRequestsOnly || !isCommercialAccount) return <MyConstructions />;
  return <CompanyPropertyRequests />;
}
