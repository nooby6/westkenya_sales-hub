import { User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSignedUrl } from '@/hooks/use-signed-url';

interface DriverAvatarProps {
  photoUrl: string | null | undefined;
  driverName: string;
  className?: string;
}

export function DriverAvatar({ photoUrl, driverName, className = "h-8 w-8" }: DriverAvatarProps) {
  const { signedUrl, loading } = useSignedUrl('driver-photos', photoUrl);

  return (
    <Avatar className={className}>
      {signedUrl && !loading ? (
        <AvatarImage src={signedUrl} alt={driverName} />
      ) : null}
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}
