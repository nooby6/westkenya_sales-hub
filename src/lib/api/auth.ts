import { apiRequest } from '@/lib/api/client';
import type { BackendLoginRequest, BackendTokenResponse } from '@/lib/api/types';

export const authApi = {
  login: (payload: BackendLoginRequest) => {
    return apiRequest<BackendTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
