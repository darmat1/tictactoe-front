import { useTranslation } from 'react-i18next';
import type { PlayerProfile, Room } from '../App';

type RoomListProps = {
  rooms: Room[];
  onJoinRoom: (roomId: string) => void;
  myProfile: PlayerProfile;
};

const RoomList = ({ rooms, onJoinRoom, myProfile }: RoomListProps) => {
  const { t } = useTranslation();

  const renderAvatar = (profile: PlayerProfile | null) => {
    if (!profile) return <div className="avatar">?</div>;
    if (profile.avatar) return <div className="avatar"><img src={profile.avatar} alt="avatar" /></div>;
    return <div className="avatar">{profile.name.charAt(0).toUpperCase()}</div>;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return t('roomList.justNow');
    if (diffMins < 60) return t('roomList.minutesAgo', { count: diffMins });
    if (diffMins < 1440) return t('roomList.hoursAgo', { count: Math.floor(diffMins / 60) });
    return t('roomList.daysAgo', { count: Math.floor(diffMins / 1440) });
  };

  if (rooms.length === 0) {
    return (
      <div className="room-list-empty">
        <p>{t('roomList.noRooms')}</p>
      </div>
    );
  }

  return (
    <div className="room-list">
      <h3>{t('roomList.title')}</h3>
      <div className="room-items">
        {rooms.map((room) => (
          <div key={room.id} className="room-item">
            <div className="room-info">
              <div className="room-id">{room.id}</div>
              <div className="room-time">{formatTime(room.createdAt)}</div>
            </div>
            <div className="room-creator">
              {renderAvatar(room.creatorProfile)}
            </div>
            <button 
              className="join-btn"
              onClick={() => onJoinRoom(room.id)}
              disabled={room.creatorProfile.id === myProfile.id}
            >
              {room.creatorProfile.id === myProfile.id 
                ? t('roomList.ownRoom') 
                : t('roomList.join')
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;