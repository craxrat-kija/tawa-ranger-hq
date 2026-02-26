import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loading } from "./Loading";
import Setup from "../pages/Setup";

import { API_BASE_URL } from "../lib/api";

export const SetupChecker = ({ children }: { children: React.ReactNode }) => {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/setup/check`);
      const data = await response.json();
      setIsSetup(data.is_setup === true);
    } catch (error) {
      console.error('Error checking setup:', error);
      setIsSetup(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return <Loading />;
  }

  if (!isSetup) {
    return <Setup />;
  }

  return <>{children}</>;
};









