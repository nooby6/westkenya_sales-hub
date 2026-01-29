import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSignedUrl(bucket: string, path: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    // If it's already a full URL (legacy data), use it directly
    if (path.startsWith('http')) {
      setSignedUrl(path);
      return;
    }

    const fetchSignedUrl = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600); // 1 hour expiry

        if (error) throw error;
        setSignedUrl(data.signedUrl);
      } catch (error) {
        console.error('Error getting signed URL:', error);
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [bucket, path]);

  return { signedUrl, loading };
}
