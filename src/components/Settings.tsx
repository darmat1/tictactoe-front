import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  toggleSound: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const UkrainianVideo = () => {
  return (
    <div className="ukrainian-video">
      <img
        src="/src/assets/images/potuzhno.gif"
        alt="Potuzhno"
        className="funny-gif"
      />
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, isMuted, toggleSound, volume, setVolume }) => {
  const { t, i18n } = useTranslation();
  
  if (!isOpen) return null;

  const shouldShowVideo = i18n.language === 'uk' && volume === 1.0;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-popup" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('settings.title')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          <div className="setting-group">
            <h3>{t('settings.language')}</h3>
            <LanguageSelector />
          </div>
          
          <div className="setting-group">
            <h3>{t('settings.sound')}</h3>
            <div className="sound-controls">
              <div className="sound-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!isMuted}
                    onChange={toggleSound}
                  />
                  <span className="slider"></span>
                </label>
                <span className="toggle-label">
                  {isMuted ? t('settings.soundOff') : t('settings.soundOn')}
                </span>
              </div>
              
              <div className="volume-control">
                <label htmlFor="volume">{t('settings.volume')}</label>
                <input
                  type="range"
                  id="volume"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={isMuted}
                />
                <span className="volume-value">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </div>
          
          {shouldShowVideo && <UkrainianVideo />}
        </div>
      </div>
    </div>
  );
};

export default Settings;