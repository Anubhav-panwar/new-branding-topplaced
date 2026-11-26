import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export const useAuthPersistence = () => {
  const { token, user, isHydrated } = useSelector((state: RootState) => state.auth);
  return { isHydrated, token, user };
};