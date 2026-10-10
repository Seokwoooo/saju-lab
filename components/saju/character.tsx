import type { Element } from '@/lib/contracts';
import { ELEMENT_LABELS } from '@/lib/contracts';

export const FRIEND_NAMES: Record<Element, string> = { wood: '새싹이', fire: '불꽃이', earth: '돌돌이', metal: '반짝이', water: '물방울이' };

export function Character({ element, className = '', decorative = false }: { element: Element; className?: string; decorative?: boolean }) {
  return <svg className={`element-friend ${className}`} viewBox="0 0 200 200" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `${ELEMENT_LABELS[element]}의 친구 ${FRIEND_NAMES[element]}`}>
    <ellipse cx="100" cy="183" rx="61" ry="9" fill="#3b483e12" />
    <g stroke="#3b483e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      {element === 'wood' && <>
        <path d="M96 58C78 41 45 47 50 68C54 90 80 93 97 78M104 62C110 36 143 34 153 50C160 69 130 84 104 75" fill="#b8d8b8" />
        <path d="M100 48L100 99" fill="none" />
        <path d="M48 100Q100 70 152 100L143 157Q133 185 100 185Q66 185 57 157Z" fill="#c3daba" />
        <path d="M44 104Q100 87 156 104L153 119Q100 104 47 119Z" fill="#e5edd8" />
        <path d="M60 145Q37 133 33 146M140 145Q164 128 170 143" fill="none" />
      </>}
      {element === 'fire' && <>
        <path d="M98 23C109 56 142 64 143 97C150 88 156 77 157 64C181 93 183 116 173 144C161 177 126 187 101 185C61 183 33 158 37 122C41 94 69 80 69 54C77 60 81 73 82 83C100 68 104 47 98 23Z" fill="#f9b194" />
        <path d="M75 161Q99 123 127 162Q123 181 99 183Q79 181 75 161Z" fill="#ffe6ae" />
        <path d="M43 125L26 135M163 126L178 132" fill="none" />
      </>}
      {element === 'earth' && <>
        <path d="M42 142C34 103 63 79 94 77C130 68 170 101 161 145Q155 184 100 185Q48 182 42 142Z" fill="#e8cc89" />
        <path d="M72 83Q60 48 85 56L98 78Q102 38 124 48Q144 61 110 81" fill="#bbd5b5" />
        <path d="M53 147L30 147M152 146L175 144" fill="none" />
      </>}
      {element === 'metal' && <>
        <path d="M100 34Q106 34 111 47L126 76L159 78Q182 80 166 99L144 123L150 156Q154 177 135 169L100 153L68 169Q46 181 51 156L57 123L33 100Q18 80 43 78L76 76L90 45Q96 34 100 34Z" fill="#d2c6eb" />
        <path d="M48 129L30 137M150 127L170 139" fill="none" />
      </>}
      {element === 'water' && <>
        <path d="M99 29C83 60 45 89 40 122C35 160 60 183 100 185C145 185 171 160 164 122C157 86 121 59 99 29Z" fill="#b9d8e9" />
        <path d="M59 105Q55 121 58 132" stroke="#edf6fb" strokeWidth="8" fill="none" />
        <path d="M45 143L27 145M160 141L177 145" fill="none" />
      </>}
    </g>
    <g fill="#3b483e">
      <ellipse cx="81" cy={element === 'wood' ? 139 : element === 'metal' ? 108 : 125} rx="3.5" ry="5" />
      <ellipse cx="119" cy={element === 'wood' ? 139 : element === 'metal' ? 108 : 125} rx="3.5" ry="5" />
    </g>
    <g transform={`translate(0 ${element === 'wood' ? 14 : element === 'metal' ? -17 : 0})`}>
      <path d="M94 133Q100 140 107 133" fill="none" stroke="#3b483e" strokeWidth="2.3" strokeLinecap="round" />
      <ellipse cx="69" cy="135" rx="9" ry="4.7" fill="#eea39488" /><ellipse cx="131" cy="135" rx="9" ry="4.7" fill="#eea39488" />
    </g>
  </svg>;
}

export function Flower({ className = '' }: { className?: string }) {
  return <svg className={`flower ${className}`} viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor"><ellipse cx="50" cy="26" rx="15" ry="23" /><ellipse cx="50" cy="26" rx="15" ry="23" transform="rotate(72 50 50)" /><ellipse cx="50" cy="26" rx="15" ry="23" transform="rotate(144 50 50)" /><ellipse cx="50" cy="26" rx="15" ry="23" transform="rotate(216 50 50)" /><ellipse cx="50" cy="26" rx="15" ry="23" transform="rotate(288 50 50)" /></g><circle cx="50" cy="50" r="13" fill="#f5dfa2" /></svg>;
}

export function Garden() {
  return <div className="garden" aria-label="나무, 불, 흙, 쇠, 물 다섯 오행 친구들이 함께 있는 작은 정원" role="img">
    <div className="garden-grid" /><div className="garden-orbit" /><span className="garden-sun" /><div className="garden-ground" />
    <span className="garden-label">a little garden of you</span>
    <Character element="wood" className="garden-wood" decorative /><Character element="fire" className="garden-fire" decorative /><Character element="earth" className="garden-earth" decorative /><Character element="metal" className="garden-metal" decorative /><Character element="water" className="garden-water" decorative />
    <Flower className="garden-flower one" /><Flower className="garden-flower two" /><Flower className="garden-flower three" />
    <span className="garden-spark spark-one">✧</span><span className="garden-spark spark-two">✧</span>
    <div className="garden-ticket"><span>모든 사람에게</span><strong>자기만의 계절이 있어요.</strong><span>SAJU LAB / EST. 2026</span></div>
  </div>;
}
